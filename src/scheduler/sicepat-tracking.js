const { Sequelize } = require('sequelize');
const sicepat = require('../helpers/sicepat');
const orderStatus = require('../constant/order-status');
const {
  Order,
  OrderLog,
  OrderDetail,
  SellerDetail,
} = require('../app/models');

const getLastStatus = (trackingStatus) => {
  let currentStatus = '';
  if (orderStatus.PROCESSED.statuses.SICEPAT.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.PROCESSED.text;
  }

  if (orderStatus.DELIVERED.statuses.SICEPAT.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.DELIVERED.text;
  }

  if (orderStatus.CANCELED.statuses.SICEPAT.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.CANCELED.text;
  }

  if (orderStatus.RETURN_TO_SELLER.statuses.SICEPAT.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.RETURN_TO_SELLER.text;
  }

  if (orderStatus.PROBLEM.statuses.SICEPAT.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.PROBLEM.text;
  }

  return currentStatus;
};

const tracking = async () => {
  try {
    const trackHistories = [];
    const order = await Order.findAll({
      where: {
        expedition: 'SICEPAT',
        [Sequelize.Op.or]: [
          {
            status: {
              [Sequelize.Op.ne]: 'DELIVERED',
            },
          },
          {
            status: {
              [Sequelize.Op.ne]: 'CANCELED',
            },
          },
          {
            status: {
              [Sequelize.Op.ne]: 'RETURN_TO_SELLER',
            },
          },
        ],
      },
    });

    await Promise.all(
      order?.map(async (item) => {
        const track = await sicepat.tracking({ resi: item.resi });

        if (track?.sicepat?.status?.code === 200) {
          const trackingStatus = track?.sicepat?.result?.last_status;
          const currentStatus = getLastStatus(trackingStatus?.status || '');

          trackHistories.push({
            orderId: item.id,
            note: trackingStatus?.city || trackingStatus?.receiver_name,
            previousStatus: item.status,
            podStatus: trackingStatus?.status,
            currentStatus,
          });

          await Order.update(
            {
              status: currentStatus,
              pod_status: trackingStatus?.status,
            },
            { where: { resi: item.resi } },
          );

          if (trackingStatus?.status === 'DELIVERED' && item.isCod) {
            const orderDetail = await OrderDetail.findOne({ where: { orderId: item.id } });
            const currentCredit = await SellerDetail.findOne({
              where: { sellerId: orderDetail.sellerId },
            });

            const calculated = (
              parseFloat(currentCredit.credit) + parseFloat(orderDetail.sellerReceivedAmount)
            );

            await SellerDetail.update(
              { credit: parseFloat(calculated) },
              { where: { sellerId: orderDetail.sellerId } },
            );
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
            currentStatus: item?.currentStatus,
            podStatus: item?.podStatus,
            note: item?.note || '',
          },
        });

        if (!log) {
          await OrderLog.create({
            orderId: item?.orderId,
            previousStatus: item?.previousStatus,
            currentStatus: item?.currentStatus,
            podStatus: item?.podStatus,
            note: item?.note || '',
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
};
