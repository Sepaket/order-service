const { Sequelize } = require('sequelize');
const sicepat = require('../helpers/sicepat');
const orderHelper = require('../helpers/order-helper');
const orderStatus = require('../constant/order-status');
const {
  Order,
  OrderLog,
  OrderDetail,
  SellerDetail,
  OrderHistory,
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
  console.log('enter sicepat tracking');
  try {
    const trackHistories = [];
    const order = await Order.findAll({
      where: {
        expedition: 'SICEPAT',
        status: {
          [Sequelize.Op.notIn]: ['DELIVERED','CANCELED','RETURN_TO_SELLER'],
        },
      },
    });

    await Promise.all(
      order?.map(async (item) => {

        const track = await sicepat.tracking({ resi: item.resi });

        if (track?.sicepat?.status?.code === 200) {

          const trackingStatus = track?.sicepat?.result?.last_status;
          const currentStatus = await getLastStatus(trackingStatus?.status || '');
          // console.log(item.id + ' : ' + item.resi + ' :: ' + currentStatus + ' -> ' + trackingStatus?.status)
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


          // NEED 4 Cases: cod & ncod and delivered & RTS
          const orderDetail = await OrderDetail.findOne({ where: { orderId: item.id } });
          let additional_note = ''
          let referralCredit = 0;
          if (currentStatus === 'DELIVERED' && item.isCod) {
            console.log('SICEPAT COD DELIVERED');
            // const orderDetail = await OrderDetail.findOne({ where: { orderId: item.id } });
            // console.log(`Item : ${item.id} amount : ${orderDetail.sellerReceivedAmount}`);
            await orderHelper.addOrderHistory(item.id, item.isCod,parseFloat(orderDetail.sellerReceivedAmount), referralCredit, false, false, currentStatus,additional_note);

          }
          if (currentStatus === 'DELIVERED' && !item.isCod) {

          }
          if (currentStatus === 'RETURN_TO_SELLER' && !item.isCod) {
            referralCredit = -1 * referralCredit;
          }
          if (currentStatus === 'RETURN_TO_SELLER' && item.isCod) {
            console.log('RETURN TO SELLER & COD')
            referralCredit = -1 * referralCredit;
            additional_note = 'return to seller & cod';
            const amounttoupdate = (-1 * parseFloat(orderDetail.shippingCalculated)) + parseFloat(orderDetail.codFeeAdmin);
            await orderHelper.addOrderHistory(item.id, item.isCod,amounttoupdate, referralCredit, false, false, currentStatus,additional_note);

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
