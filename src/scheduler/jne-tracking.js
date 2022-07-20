const { Sequelize } = require('sequelize');
const jne = require('../helpers/jne');
const { Order, OrderLog } = require('../app/models');
const orderStatus = require('../constant/order-status');

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

const tracking = async () => {
  try {
    const trackHistories = [];
    const order = await Order.findAll({
      where: {
        expedition: 'JNE',
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
        ],
      },
    });

    await Promise.all(
      order?.map(async (item) => {
        const track = await jne.tracking({ resi: item?.resi });

        if (!track?.error) {
          const trackingStatus = track?.history[track?.history?.length - 1];
          const currentStatus = getLastStatus(trackingStatus?.code || '');

          track?.history?.forEach((historical) => {
            trackHistories.push({
              orderId: item?.id,
              note: historical.desc,
              previousStatus: item.status,
              currentStatus,
            });
          });

          await Order.update(
            {
              status: currentStatus,
              podStatus: trackingStatus?.code,
            },
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
