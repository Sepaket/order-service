const { Sequelize } = require('sequelize');
const jne = require('../helpers/jne');
const orderStatus = require('../constant/order-status');
const {
  Order,
  OrderLog,
  OrderDetail,
  SellerDetail,
  OrderHistory,
  TrackingHistory,
  Seller,
} = require('../app/models');
const { del } = require('express/lib/application');



async function addOrderHistory(orderId, deltaCredit, isExecute, onHold,note,orderDetail) {

console.log(orderId);
  console.log('start')
  await OrderHistory.findOne({
    where: { orderId: orderId}
  }).then(async (result) => {
    console.log('inside here')
    if (result === null) {
      console.log('order history is NULL')
      const referralRate = Number(orderDetail.referralRate);
      const referralRateType = orderDetail.referralRateType;
      //shipping calculated di tambah kembali dengan codfreeadmin karena untuk perhitungan referal tidak menggunakan codfeeadmin
      const shippingCalculated = Number(orderDetail.shippingCalculated) - Number(orderDetail.codFeeAdmin);
      let referralCredit = 0;
      const referredId = orderDetail.referredSellerId;
      console.log(referredId)
      console.log('==')
      // console.log(orderDetail)
      if (referralRateType === 'PERCENTAGE') {
        console.log('calculate referral')
        console.log(referralRate)
        console.log(shippingCalculated)
        referralCredit = referralRate * shippingCalculated / 100
        console.log(referralCredit)
      }

      await OrderHistory.create({
        orderId: orderId,
        deltaCredit: deltaCredit,
        isExecute: isExecute,
        onHold: onHold,
        note: note,
        referralId: referredId,
        referralCredit: referralCredit,
        referralBonusExecuted: false
      });
    } else {
      console.log('order history existed');

    }

  })



}
async function updateSaldo(calculated1, orderDetail) {
  // the updateSaldo is deprecated in favor of creditUpdater() calculation
  //     console.log('credit : ' + orderDetail.seller.sellerDetail.credit);
  //   const credit = orderDetail.seller.sellerDetail.credit === 'NaN' ? 0 : orderDetail.seller.sellerDetail.credit;
  //   const calculated = parseFloat(credit) + calculated1;
  //   console.log(orderDetail.orderId + ' credit : ' + credit);
  //   SellerDetail.update(
  //     { credit: parseFloat(calculated) },
  //     { where: { sellerId: orderDetail.sellerId } },
  //   );

}

const getLastStatus = (trackingStatus) => {
  // console.log('tracking status : ' + trackingStatus);
  let currentStatus = '';
  if (orderStatus.PROCESSED.statuses.JNE.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.PROCESSED.text;
  }

  if (orderStatus.DELIVERED.statuses.JNE.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.DELIVERED.text;
  }

  if (orderStatus.CANCELED.statuses.JNE.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.CANCELED.text;
  }

  if (orderStatus.RETURN_TO_SELLER.statuses.JNE.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.RETURN_TO_SELLER.text;
  }

  if (orderStatus.PROBLEM.statuses.JNE.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.PROBLEM.text;
  }
  // console.log('curn : ' + currentStatus)
  return currentStatus;
};
const creditUpdate = async () => {
  console.log('order credit update');
  try {
    const histories = await OrderHistory.findAll({
      include:[
        {
          model: OrderDetail,
          as: 'orderDetail',
          required: true,
          include : {
            model: Seller,
            as: 'seller',
            required: true,
            include : {
              model: SellerDetail,
              as: 'sellerDetail',
              required: true,
            }
          },
        },


      ],
      where: {
        isExecute: false,
        // [Sequelize.Op.or]: [
        //   {
        //     status: {
        //       [Sequelize.Op.notIn]: [
        //         'DELIVERED', 'CANCELED',
        //         'RETURN_TO_SELLER',
        //       ],
        //     },
        //   },
        // ],
      },
    });

    await Promise.all(
      histories?.map(async (history) => {
        // console.log(history.orderDetail.seller.sellerDetail.credit);
        // updateSaldo(history.deltaCredit,history.orderDetail)
      }),
      );
  } catch (error) {
    throw new Error(error);
  }
};

const tracking = async () => {
  console.log('inside JNE tracking');
  try {
    const trackHistories = [];
    const order = await Order.findAll({
      include:[
        {
          model: OrderDetail,
          as: 'detail',
          required: true,
        include : {
          model: Seller,
          as: 'seller',
          required: true,
          include : {
            model: SellerDetail,
            as: 'sellerDetail',
            required: true,
          }
        },
        },

      ],
      where: {
        expedition: 'JNE',
        [Sequelize.Op.or]: [
          {
            status: {
              [Sequelize.Op.notIn]: [
                'DELIVERED', 'CANCELED',
                'RETURN_TO_SELLER',
              ],
            },
          },
        ],
      },
    });

    console.log('Order size : ' + order.length)
    await Promise.all(
      order?.map(async (item) => {
        const track = await jne.tracking({ resi: item?.resi });


        if (!track?.error) {
          // const trackingStatus = track?.history[track?.history?.length - 1];
          // DIBAWAH INI KODE LAMA
          // const currentStatus = getLastStatus(trackingStatus?.code || '');

        let currentStatus = '';

          // RENO
          if (track?.cnote.pod_code === null) {
            currentStatus = 'PROCESSED';
          } else {
            currentStatus = getLastStatus(track?.cnote.pod_code || '');
            // if (item.resi === 'SPKET67305290054') {
            //   console.log('resi : ' + item.resi);
            //   console.log(track?.cnote.pod_code);
            //   console.log(track?.cnote.pod_status);
            //   console.log(currentStatus);
            // }
          }

          // const currentStatus = getLastStatus(historical.code || '');

          track?.history?.forEach((historical) => {
            trackHistories.push({
              orderId: item?.id,
              note: historical.desc,
              previousStatus: item.status,
              podStatus: historical.code,
              // podStatus: trackingStatus?.code,
              currentStatus: getLastStatus(historical.code || ''),
            });
            // if (item.resi === 'SPKET67305290054') {
            //   console.log('resi : ' + item.resi);
            //   console.log(historical.code);
            // }
          });
          await TrackingHistory.findOne({
            where: { orderId: item.id }
          }).then(async (result) => {
            if (result === null) {
              await TrackingHistory.create({
                orderId: item.id,
                cnoteRaw: JSON.stringify(track?.cnote),
                detailRaw: JSON.stringify(track?.detail),
                historyRaw: JSON.stringify(track?.history),
                cnotePodDate: track.cnote.cnote_pod_date,
                cnotePodStatus: track.cnote.pod_status,
                cnotePodCode: track.cnote.pod_code,
                cnoteLastStatus: track.cnote.last_status,
                cnoteEstimateDelivery: track.cnote.estimate_delivery,
              });
            } else {
              await TrackingHistory.update({
                cnoteRaw: JSON.stringify(track?.cnote),
                detailRaw: JSON.stringify(track?.detail),
                historyRaw: JSON.stringify(track?.history),
                  cnotePodDate: track.cnote.cnote_pod_date,
                  cnotePodStatus: track.cnote.pod_status,
                  cnotePodCode: track.cnote.pod_code,
                  cnoteLastStatus: track.cnote.last_status,
                  cnoteEstimateDelivery: track.cnote.estimate_delivery,
              },
                { where: { orderId: item.id } },
                );

            }

          })

          Order.update(
            {
              status: currentStatus,
              podStatus: track?.cnote.pod_code,
              // podStatus: trackingStatus?.code,
            },
            { where: { resi: item.resi } },
          );
          var calculated_1 = 0;
          // const orderDetail =  await OrderDetail.findOne({ where: { orderId: item.id } });
          const orderDetail = item.detail;
          const log =  await OrderLog.findAll({ where: { orderId: item.id } });



          if (currentStatus === 'DELIVERED' && item.isCod && log.length > 0) {
            console.log('order detail reno')
            console.log(orderDetail)
            calculated_1 = parseFloat(orderDetail.sellerReceivedAmount);
            console.log('after caclulated_1')
            console.log(calculated_1);
              // await updateSaldo(calculated_1,orderDetail);
              await addOrderHistory(item.id, calculated_1, false, false, currentStatus, orderDetail);
          }

          if (currentStatus === 'DELIVERED' && !item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.shippingCalculated);
            // await updateSaldo(calculated_1,orderDetail);
            await addOrderHistory(item.id, calculated_1, true, false, currentStatus,orderDetail);

          }

          if (currentStatus === 'RETURN_TO_SELLER' && !item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.shippingCalculated);
            // await updateSaldo(calculated_1,orderDetail);
            await addOrderHistory(item.id, calculated_1, false, false, currentStatus,orderDetail);
          }




          if (currentStatus === 'RETURN_TO_SELLER' && item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.codFeeAdmin) - parseFloat(orderDetail.shippingCalculated);
            console.log(`${item.resi  } calculated : ${calculated_1}`);
            await updateSaldo(calculated_1,orderDetail);
            await OrderHistory.create({
              orderId: item.id,
              deltaCredit: calculated_1,
              note: currentStatus,
            });
            // console.log('order history is created ' + item.orderId);
          }


        }

        return item;
      }),
    );

    await Promise.all(
      trackHistories?.map(async (item) => {
        const log = await OrderLog.findOne({
          where: {
            orderId: item?.orderId,
            // currentStatus: item?.currentStatus,
            podStatus: item?.podStatus,
            note: item?.note,
          },
        });

        if (!log) {
          await OrderLog.create({
            orderId: item?.orderId,
            previousStatus: item?.previousStatus,
            currentStatus: item?.currentStatus,
            podStatus: item?.podStatus,
            note: item?.note,
          });
        }

      }),
    );
  } catch (error) {
    throw new Error(error);
  }
};

const force_retracking = async () => {
  console.log('FORCE RE-tracking');
  try {
    const trackHistories = [];
    const order = await Order.findAll({
      include:[
        {
          model: OrderDetail,
          as: 'detail',
          required: true,
          include : {
            model: Seller,
            as: 'seller',
            required: true,
            include : {
              model: SellerDetail,
              as: 'sellerDetail',
              required: true,
            }
          },
        },

      ],
      where: {
        // expedition: 'JNE',
        // [Sequelize.Op.or]: [
        //   {
        //     status: {
        //       [Sequelize.Op.notIn]: [
        //         'DELIVERED', 'CANCELED',
        //         'RETURN_TO_SELLER',
        //       ],
        //     },
        //   },
        // ],
      },
    });
    await Promise.all(
      order?.map(async (item) => {
        const track = await jne.tracking({ resi: item?.resi });
        if (!track?.error) {
          // const trackingStatus = track?.history[track?.history?.length - 1];
          // DIBAWAH INI KODE LAMA
          // const currentStatus = getLastStatus(trackingStatus?.code || '');

          // RENO
          const currentStatus = getLastStatus(track?.cnote.pod_code || '');
          // const currentStatus = getLastStatus(historical.code || '');

          track?.history?.forEach((historical) => {
            trackHistories.push({
              orderId: item?.id,
              note: historical.desc,
              previousStatus: item.status,
              podStatus: historical.code,
              // podStatus: trackingStatus?.code,
              currentStatus: getLastStatus(historical.code || ''),
            });
          });
          await TrackingHistory.findOne({
            where: { orderId: item.id }
          }).then(async (result) => {
            if (result === null) {
              await TrackingHistory.create({
                orderId: item.id,
                cnoteRaw: JSON.stringify(track?.cnote),
                detailRaw: JSON.stringify(track?.detail),
                historyRaw: JSON.stringify(track?.history),
                cnotePodDate: track.cnote.cnote_pod_date,
                cnotePodStatus: track.cnote.pod_status,
                cnotePodCode: track.cnote.pod_code,
                cnoteLastStatus: track.cnote.last_status,
                cnoteEstimateDelivery: track.cnote.estimate_delivery,
              });
            } else {
              await TrackingHistory.update({
                  cnoteRaw: JSON.stringify(track?.cnote),
                  detailRaw: JSON.stringify(track?.detail),
                  historyRaw: JSON.stringify(track?.history),
                  cnotePodDate: track.cnote.cnote_pod_date,
                  cnotePodStatus: track.cnote.pod_status,
                  cnotePodCode: track.cnote.pod_code,
                  cnoteLastStatus: track.cnote.last_status,
                  cnoteEstimateDelivery: track.cnote.estimate_delivery,
                },
                { where: { orderId: item.id } },
              );

            }

          })
          Order.update(
            {
              status: currentStatus,
              podStatus: track?.cnote.pod_code,
              // podStatus: trackingStatus?.code,
            },
            { where: { resi: item.resi } },
          );
          var calculated_1 = 0;
          // const orderDetail =  await OrderDetail.findOne({ where: { orderId: item.id } });
          const orderDetail = item.detail;
          const log =  await OrderLog.findAll({ where: { orderId: item.id } });



          if (currentStatus === 'DELIVERED' && item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.sellerReceivedAmount);
            // await updateSaldo(calculated_1,orderDetail);
            await addOrderHistory(item.id, calculated_1, false, false, currentStatus,orderDetail);
          }

          if (currentStatus === 'DELIVERED' && !item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.shippingCalculated);
            // await updateSaldo(calculated_1,orderDetail);
            await addOrderHistory(item.id, calculated_1, true, false, currentStatus,orderDetail);

          }

          if (currentStatus === 'RETURN_TO_SELLER' && !item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.shippingCalculated);
            // await updateSaldo(calculated_1,orderDetail);
            await addOrderHistory(item.id, calculated_1, false, false, currentStatus,orderDetail);
          }




          if (currentStatus === 'RETURN_TO_SELLER' && item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.codFeeAdmin) - parseFloat(orderDetail.shippingCalculated);
            console.log(`${item.resi  } calculated : ${calculated_1}`);
            await updateSaldo(calculated_1,orderDetail);
            await OrderHistory.create({
              orderId: item.id,
              deltaCredit: calculated_1,
              note: currentStatus,
            });
            // console.log('order history is created ' + item.orderId);
          }


        }

        return item;
      }),
    );

    await Promise.all(
      trackHistories?.map(async (item) => {
        const log = await OrderLog.findOne({
          where: {
            orderId: item?.orderId,
            // currentStatus: item?.currentStatus,
            podStatus: item?.podStatus,
            note: item?.note,
          },
        });

        if (!log) {
          await OrderLog.create({
            orderId: item?.orderId,
            previousStatus: item?.previousStatus,
            currentStatus: item?.currentStatus,
            podStatus: item?.podStatus,
            note: item?.note,
          });
        }

      }),
    );
  } catch (error) {
    throw new Error(error);
  }
};


module.exports = {
  tracking,
  force_retracking,
  // creditUpdate, // creditUpdate is done from batch-updater. not tracking updater
};
