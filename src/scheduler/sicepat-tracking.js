const { Sequelize } = require('sequelize');
const sicepat = require('../helpers/sicepat');
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

async function addOrderHistory(orderId, isCod, deltaCredit, isExecute, onHold,note,additional_note, orderDetail) {

  await OrderHistory.findOne({
    where: { orderId: orderId}
  }).then(async (result) => {
    if (result === null) {
      console.log('order history is NULL')
      const referralRate = Number(orderDetail.referralRate);
      const referralRateType = orderDetail.referralRateType;
      //shipping calculated di tambah kembali dengan codfreeadmin karena untuk perhitungan referal tidak menggunakan codfeeadmin
      const shippingCalculated = Number(orderDetail.shippingCalculated) - Number(orderDetail.codFeeAdmin);
      let referralCredit = 0;
      const referredId = orderDetail.referredSellerId;
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
        isCod:isCod,
        provider:'JNE',
        onHold: onHold,
        note: note,
        additional_note: additional_note,
        referralId: referredId,
        referralCredit: referralCredit,
        referralBonusExecuted: false
      });
    } else {
      console.log('order history existed');

    }

  })

}


const tracking = async () => {
  // console.log('enter sicepat tracking');
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
        // console.log('orders size : ')

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
          if (currentStatus === 'DELIVERED' && item.isCod) {
            // const orderDetail = await OrderDetail.findOne({ where: { orderId: item.id } });
            const currentCredit = await SellerDetail.findOne({
              where: { sellerId: orderDetail.sellerId },
            });

            const credit = currentCredit.credit === 'NaN' ? 0 : currentCredit.credit;
            const calculated = parseFloat(credit) + parseFloat(orderDetail.sellerReceivedAmount);
            console.log(`Item : ${item.id} amount : ${orderDetail.sellerReceivedAmount} total : ${calculated}`);
            await SellerDetail.update(
              { credit: parseFloat(calculated) },
              { where: { sellerId: orderDetail.sellerId } },
            );
          }
          if (currentStatus === 'DELIVERED' && !item.isCod) {

          }
          if (currentStatus === 'RETURN_TO_SELLER' && !item.isCod) {

          }
          if (currentStatus === 'RETURN_TO_SELLER' && item.isCod) {
            console.log('RETURN TO SELLER & COD')
            additional_note = 'return to seller & cod';
            const amounttoupdate = (-1 * parseFloat(orderDetail.shippingCalculated)) + parseFloat(orderDetail.codFeeAdmin);
            await addOrderHistory(item.id, item.isCod,amounttoupdate, false, false, currentStatus,additional_note, orderDetail);



            // console.log(item.resi)
            // const orderDetail = await OrderDetail.findOne({ where: { orderId: item.id } });
            // const currentCredit = await SellerDetail.findOne({
            //   where: { sellerId: orderDetail.sellerId },
            // });
            //
            // const credit = currentCredit.credit === 'NaN' ? 0 : currentCredit.credit;
            // const calculated = parseFloat(credit) - parseFloat(orderDetail.shippingCalculated);
            // console.log(`Item : ${item.id} amount : ${orderDetail.sellerReceivedAmount} total : ${calculated}`);
            // await SellerDetail.update(
            //   { credit: parseFloat(calculated) },
            //   { where: { sellerId: orderDetail.sellerId } },
            // );
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
