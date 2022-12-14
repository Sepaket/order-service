const { Sequelize } = require('sequelize');
const jne = require('../helpers/jne');
const orderStatus = require('../constant/order-status');
const {
  Order,
  OrderLog,
  OrderDetail,
  SellerDetail,
} = require('../app/models');

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
          // {
          //   status: {
          //     [Sequelize.Op.ne]: 'DELIVERED',
          //   },
          // },
          // {
          //   status: {
          //     [Sequelize.Op.ne]: 'CANCELED',
          //   },
          // },
          {
            status: {
              // [Sequelize.Op.ne]: 'RETURN_TO_SELLER',
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
        // console.log('Item id : ' + item.id);
        if (!track?.error) {
          const trackingStatus = track?.history[track?.history?.length - 1];
          const currentStatus = getLastStatus(trackingStatus?.code || '');
          // console.log(item.resi + ' : ' + currentStatus);
          track?.history?.forEach((historical) => {
            trackHistories.push({
              orderId: item?.id,
              note: historical.desc,
              previousStatus: item.status,
              podStatus: trackingStatus?.code,
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

          const log = await OrderLog.findAll({ where: { orderId: item.id } });

          // console.log(item.resi + ' : ' + currentStatus);
          //  console.log('log length : ' + log.length);
          // console.log(`${item.resi} : ${currentStatus}`);
          // console.log(`log length : ${log.length}`);
          if (currentStatus === 'DELIVERED' && item.isCod && log.length > 0
            // && log.length < 2
          ) {
            console.log(item.resi + ' : ' + currentStatus);
            console.log('log length : ' + log.length);
            // console.log('SCHEDULER - JNE - TRACKING - DELIVERED');
            const orderDetail = await OrderDetail.findOne({ where: { orderId: item.id } });
            const currentCredit = await SellerDetail.findOne({
              where: { sellerId: orderDetail.sellerId },
            });

            const credit = currentCredit.credit === 'NaN' ? 0 : currentCredit.credit;
            const calculated = parseFloat(credit) + parseFloat(orderDetail.sellerReceivedAmount);

            await SellerDetail.update(
              { credit: parseFloat(calculated) },
              { where: { sellerId: orderDetail.sellerId } },
            );
          }

          if (currentStatus === 'PROCESSED' && item.isCod && log.length > 0
            // && log.length < 2
          ) {
            // console.log(item.resi + ' : ' + currentStatus);
            // console.log('log length : ' + log.length);
            // console.log('SCHEDULER - JNE - TRACKING - DELIVERED');
            const orderDetail = await OrderDetail.findOne({ where: { orderId: item.id } });
            const currentCredit = await SellerDetail.findOne({
              where: { sellerId: orderDetail.sellerId },
            });

            const credit = currentCredit.credit === 'NaN' ? 0 : currentCredit.credit;
            const calculated = parseFloat(credit) + parseFloat(orderDetail.sellerReceivedAmount);

            await SellerDetail.update(
              { credit: parseFloat(calculated) },
              { where: { sellerId: orderDetail.sellerId } },
            );
          }


          // RENO MASIH SAMPAI DIBAWAH INIb
          if (currentStatus === 'RETURN_TO_SELLER' && item.isCod && log.length > 0) {
            // console.log('SCHEDULER - JNE - TRACKING - RETURN TO SELLER');
            // console.log(`${item.resi} : ${currentStatus}`);
            // console.log(`log length : ${log.length}`);
            // console.log(item.resi + ' : ' + currentStatus);
            // console.log('log length : ' + log.length);
            const orderDetail = await OrderDetail.findOne({ where: { orderId: item.id } });
            const currentCredit = await SellerDetail.findOne({
              where: { sellerId: orderDetail.sellerId },
            });
            const credit = currentCredit.credit === 'NaN' ? 0 : currentCredit.credit;
            const calculated = parseFloat(credit) - parseFloat(orderDetail.shippingCalculated);
            // console.log(item.resi + ` calculated : ${calculated}`);
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
};
