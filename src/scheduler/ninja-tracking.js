const { Sequelize } = require('sequelize');
const ninja = require('../helpers/ninja');
const { Order, OrderLog } = require('../app/models');
const orderStatus = require('../constant/order-status');

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
        expedition: 'NINJA',
        status: {
          [Sequelize.Op.ne]: 'DELIVERED',
        },
      },
    });

    await Promise.all(
      order?.map(async (item) => {
        const track = await ninja.tracking({ resi: item.resi });

        if (track?.sicepat?.status?.code === 200) {
          const trackingStatus = track?.sicepat?.result?.last_status;
          const currentStatus = getLastStatus(trackingStatus?.status || '');

          trackHistories.push({
            orderId: item.id,
            note: trackingStatus?.city || trackingStatus?.receiver_name,
            previousStatus: item.status,
            currentStatus,
          });

          await Order.update(
            { status: currentStatus },
            { where: { resi: item.resi } },
          );
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
            note: item?.note,
          },
        });

        if (!log) {
          await OrderLog.create({
            orderId: item?.orderId,
            previousStatus: item?.previousStatus,
            currentStatus: item?.currentStatus,
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
};
