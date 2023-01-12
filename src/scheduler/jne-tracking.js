const { Sequelize } = require('sequelize');
const jne = require('../helpers/jne');
const orderStatus = require('../constant/order-status');
const {
  Order,
  OrderLog,
  OrderDetail,
  SellerDetail,
  OrderHistory,
  Seller,
} = require('../app/models');




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
    await Promise.all(
      order?.map(async (item) => {
        const track = await jne.tracking({ resi: item?.resi });
        // console.log('credit id : ' + item.detail.seller.sellerDetail.credit);
        if (!track?.error) {
          // const trackingStatus = track?.history[track?.history?.length - 1];
          // console.log('POD STATUS :');
          // console.log(track?.cnote.pod_status);
          // DIBAWAH INI KODE LAMA
          // const currentStatus = getLastStatus(trackingStatus?.code || '');

          // RENO
          const currentStatus = getLastStatus(track?.cnote.pod_code || '');


          // const currentStatus = getLastStatus(historical.code || '');
          // console.log(`${item.resi  } : ${  currentStatus}`);
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
          // console.log(`${item.id} : ${item.resi} : ${currentStatus}`); //RENO
          if (currentStatus === 'DELIVERED' && item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.sellerReceivedAmount);
              await updateSaldo(calculated_1,orderDetail);
            await OrderHistory.create({
              orderId: item.id,
              deltaCredit: calculated_1,
              note: currentStatus,
            });
            // console.log('order history is created ' + item.orderId);
          }

          if (currentStatus === 'DELIVERED' && !item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.shippingCalculated);
            // await updateSaldo(calculated_1,orderDetail);
            await OrderHistory.create({
              orderId: item.id,
              deltaCredit: calculated_1,
              note: currentStatus,
              isExecute: true,
            });
            // console.log('order history is created ' + item.orderId);
          }

          if (currentStatus === 'RETURN_TO_SELLER' && !item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.shippingCalculated);
            await updateSaldo(calculated_1,orderDetail);
            await OrderHistory.create({
              orderId: item.id,
              deltaCredit: calculated_1,
              note: currentStatus,
              isExecute: false,
            });
            // console.log('order history is created ' + item.orderId);
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
          // console.log(`create ${  item.note}`);
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
  // creditUpdate, // creditUpdate is done from batch-updater. not tracking updater
};
