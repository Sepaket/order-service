const { Sequelize } = require('sequelize');
const sap = require('../helpers/sap');
const orderHelper = require('../helpers/order-helper');
const orderStatus = require('../constant/order-status');
const {
  Order,
  OrderLog,
  OrderDetail,
  SellerDetail,
  OrderHistory,
  sequelize,
} = require('../app/models');

const getLastStatus = (trackingStatus) => {
  let currentStatus = '';
  if (orderStatus.PROCESSED.statuses.SAP.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.PROCESSED.text;
  }
  if (orderStatus.DELIVERED.statuses.SAP.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.DELIVERED.text;
  }
  if (orderStatus.CANCELED.statuses.SAP.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.CANCELED.text;
  }
  if (orderStatus.RETURN_TO_SELLER.statuses.SAP.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.RETURN_TO_SELLER.text;
  }
  if (orderStatus.PROBLEM.statuses.SAP.indexOf(trackingStatus) !== -1) {
    currentStatus = orderStatus.PROBLEM.text;
  }
  return currentStatus;
};

const tracking = async () => {
  try {

    const trackHistories = [];
    const order = await Order.findAll({
      where: {
        expedition: 'SAP',
        status: {
          [Sequelize.Op.notIn]: ['DELIVERED','CANCELED','RETURN_TO_SELLER', 'WAITING_PICKUP_EXP', 'PROCESSED_EXP', 'PROBLEM_EXP'],
        },
      },
      limit: 30,
    });
    const dbTransaction = await sequelize.transaction()
    await Promise.all(
      order?.map(async (item) => {
        const track = await sap.tracking({ resi: item.resi });
        // console.log('sap tracking : ', item.resi);
        //
        if (track?.sap?.status?.code === 200) {
          const arrayLength = track.sap.result.length;
          // console.log(item.resi,'track : ', track.sap.result)
          const trackingStatus = track?.sap?.result[arrayLength - 1]?.rowstate_name;
          console.log('tracking status : ', trackingStatus)
          const currentStatus = await getLastStatus(trackingStatus || '');
          // console.log(item.resi, 'current status : ', currentStatus)
          // console.log('========================')
          // console.log(item.id + ' : ' + item.resi + ' :: ' + currentStatus + ' -> ' + trackingStatus?.status)
          trackHistories.push({
            orderId: item.id,
            note: track.sap?.result[arrayLength - 1].description,
            previousStatus: item.status,
            podStatus: trackingStatus,
            currentStatus,
          });
          // console.log('trackhistories  : ', trackHistories);
          const updateResult = await Order.update(
            {
              status: currentStatus,
              pod_status: trackingStatus,
            },
            { where: { resi: item.resi } },
            { transaction: dbTransaction },
          );

          console.log(item.resi, 'udpate Reulst  : ', updateResult);

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
    await dbTransaction.commit();
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

    return (order);
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  tracking,
};
