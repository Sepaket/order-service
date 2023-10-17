const { Sequelize } = require('sequelize');
const { del } = require('express/lib/application');
const jne = require('../helpers/jne');
const orderHelper = require('../helpers/order-helper');
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

async function updateOrderHistory() {
  console.log('update tracking history');
}
async function updateOrder() {
  console.log('update tracking history');
}
async function updateSellerDetail() {
  console.log('update tracking history');
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
  return currentStatus;
};
const creditUpdate = async () => {
  console.log('order credit update');
  try {
    const histories = await OrderHistory.findAll({
      include: [
        {
          model: OrderDetail,
          as: 'orderDetail',
          required: true,
          include: {
            model: Seller,
            as: 'seller',
            required: true,
            include: {
              model: SellerDetail,
              as: 'sellerDetail',
              required: true,
            },
          },
        },

      ],
      where: {
        isExecute: false,
      },
    });

    await Promise.all(
      histories?.map(async (history) => {
      }),
    );
  } catch (error) {
    throw new Error(error);
  }
};

const tracking = async () => {
  console.log('tracking jne');
  try {
    const trackHistories = [];
    const order = await Order.findAndCountAll({
      include: [
        {
          model: OrderDetail,
          as: 'detail',
          required: true,
          include: {
            model: Seller,
            as: 'seller',
            required: true,
            include: {
              model: SellerDetail,
              as: 'sellerDetail',
              required: true,
            },
          },
        },

      ],
      where: {

        [Sequelize.Op.and]: [
          {
            status: {
              [Sequelize.Op.notIn]: [
                'DELIVERED', 'CANCELED',
                'RETURN_TO_SELLER',
              ],
            },
          },
          {
            expedition: {
              [Sequelize.Op.in]: [
                'JNE',
              ],
            },
          }
        ],
      },
    });


    await Promise.all(
      order.rows?.map(async (item) => {
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
          });
          await TrackingHistory.findOne({
            where: { orderId: item.id },
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
              { where: { orderId: item.id } });
            }
          });

          Order.update(
            {
              status: currentStatus,
              podStatus: track?.cnote.pod_code,
              // podStatus: trackingStatus?.code,
            },
            { where: { resi: item.resi } },
          );
          let calculated1 = 0;
          let referralCredit = 0;
          const orderDetail = item.detail;
          const log = await OrderLog.findAll({ where: { orderId: item.id } });

          if (currentStatus === 'DELIVERED' && item.isCod && log.length > 0) {
            calculated1 = parseFloat(orderDetail.sellerReceivedAmount);
            await orderHelper.addOrderHistory(item.id, item.isCod, calculated1, referralCredit, false, false, currentStatus);
          }

          if (currentStatus === 'DELIVERED' && !item.isCod && log.length > 0) {
            calculated1 = 0;
            await orderHelper.addOrderHistory(item.id, item.isCod, calculated1, referralCredit, true, false, currentStatus);
          }

          if (currentStatus === 'RETURN_TO_SELLER' && !item.isCod && log.length > 0) {
            calculated1 = parseFloat(orderDetail.shippingCalculated);
            // eslint-disable-next-line operator-assignment
            referralCredit = -1 * referralCredit;
            await orderHelper.addOrderHistory(item.id, item.isCod, calculated1, referralCredit, false, false, currentStatus);
          }

          if (currentStatus === 'RETURN_TO_SELLER' && item.isCod && log.length > 0) {
            calculated1 = parseFloat(orderDetail.codFeeAdmin) - parseFloat(orderDetail.shippingCalculated);
            referralCredit = -1 * referralCredit;
            await orderHelper.addOrderHistory(item.id, item.isCod, calculated1, referralCredit, false, false, currentStatus);
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
      include: [
        {
          model: OrderDetail,
          as: 'detail',
          required: true,
          include: {
            model: Seller,
            as: 'seller',
            required: true,
            include: {
              model: SellerDetail,
              as: 'sellerDetail',
              required: true,
            },
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
            where: { orderId: item.id },
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
              { where: { orderId: item.id } });
            }
          });
          Order.update(
            {
              status: currentStatus,
              podStatus: track?.cnote.pod_code,
              // podStatus: trackingStatus?.code,
            },
            { where: { resi: item.resi } },
          );
          let calculated_1 = 0;
          // const orderDetail =  await OrderDetail.findOne({ where: { orderId: item.id } });
          const orderDetail = item.detail;
          const log = await OrderLog.findAll({ where: { orderId: item.id } });

          if (currentStatus === 'DELIVERED' && item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.sellerReceivedAmount);
            // await updateSaldo(calculated_1,orderDetail);
            await orderHelper.addOrderHistory(item.id, item.isCod, calculated_1, false, false, currentStatus, orderDetail);
          }

          if (currentStatus === 'DELIVERED' && !item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.shippingCalculated);
            // await updateSaldo(calculated_1,orderDetail);
            await orderHelper.addOrderHistory(item.id, item.isCod, calculated_1, true, false, currentStatus, orderDetail);
          }

          if (currentStatus === 'RETURN_TO_SELLER' && !item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.shippingCalculated);
            // await updateSaldo(calculated_1,orderDetail);
            await orderHelper.addOrderHistory(item.id, item.isCod, calculated_1, false, false, currentStatus, orderDetail);
          }

          if (currentStatus === 'RETURN_TO_SELLER' && item.isCod && log.length > 0) {
            calculated_1 = parseFloat(orderDetail.codFeeAdmin) - parseFloat(orderDetail.shippingCalculated);
            // console.log(`${item.resi} calculated : ${calculated_1}`);
            // await updateSaldo(calculated_1, orderDetail);
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
