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
  console.log('inside JNE tracking');
  try {
    const trackHistories = [];
    const order = await Order.findAll({
//       attributes: [
// 'id','resi',
//       ],
      include:[
        {
          model: OrderDetail,
          as: 'detail',
          // as:'ads',
          // where:{
          //   is_valid:1,
          //   is_vertify:1},
          required: true,
        }
      ],
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
    console.log(`order length : ${  order.length}`);
    await Promise.all(
      order?.map(async (item) => {
        // console.log(item.id);
        // console.log(item.detail.sellerId);
        const track = await jne.tracking({ resi: item?.resi });
        // console.log('Item id : ' + item.id);
        if (!track?.error) {
          const trackingStatus = track?.history[track?.history?.length - 1];
          const currentStatus = getLastStatus(trackingStatus?.code || '');
          // const currentStatus = getLastStatus(historical.code || '');
          // console.log(item.resi + ' : ' + currentStatus);
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

          await Order.update(
            {
              status: currentStatus,
              podStatus: trackingStatus?.code,
            },
            { where: { resi: item.resi } },
          );

          const log = await OrderLog.findAll({ where: { orderId: item.id } });

          console.log(`${item.id} : ${item.resi} : ${currentStatus}`); //RENO
          if (currentStatus === 'DELIVERED' && item.isCod && log.length > 0) {

            // console.log('SCHEDULER - JNE - TRACKING - DELIVERED');
            const orderDetail = await OrderDetail.findOne({ where: { orderId: item.id } });
            const currentCredit = await SellerDetail.findOne({
              where: { sellerId: orderDetail.sellerId },
            });

            const credit = currentCredit.credit === 'NaN' ? 0 : currentCredit.credit;
            const calculated = parseFloat(credit) + parseFloat(orderDetail.sellerReceivedAmount);
            if ((item.id === 647) || (item.id === 654)) {
              console.log(item.id);
              console.log(credit);
              console.log(orderDetail.sellerReceivedAmount);
            }

            await SellerDetail.update(
              { credit: parseFloat(calculated) },
              { where: { sellerId: orderDetail.sellerId } },
            );
          }


          if (currentStatus === 'RETURN_TO_SELLER' && item.isCod && log.length > 0) {
            // console.log('SCHEDULER - JNE - TRACKING - RETURN TO SELLER');


            // console.log('log length : ' + log.length);
            const orderDetail = await OrderDetail.findOne({ where: { orderId: item.id } });
            const currentCredit = await SellerDetail.findOne({
              where: { sellerId: orderDetail.sellerId },
            });
            // console.log(parseFloat(orderDetail.codFeeAdmin));
            const credit = currentCredit.credit === 'NaN' ? 0 : currentCredit.credit;
            const calculated = parseFloat(credit) - parseFloat(orderDetail.shippingCalculated) + parseFloat(orderDetail.codFeeAdmin);
            console.log(item.resi + ` calculated : ${calculated}`);
            await SellerDetail.update(
              { credit: parseFloat(calculated) },
              { where: { sellerId: orderDetail.sellerId } },
            );
          }
        }

        return item;
      }),
    );

    // console.log(order.length);
    await Promise.all(
      trackHistories?.map(async (item) => {
        if (item.orderId == 436) { //262
          // console.log(`${item.orderId} : ${item.previousStatus} : ${item.currentStatus} : ${item.podStatus}`);
        } else {
          // console.log(`${item.orderId} : ${item.currentStatus}`);
          // console.log(item.orderId)
        }

        const log = await OrderLog.findOne({
          where: {
            orderId: item?.orderId,
            // currentStatus: item?.currentStatus,
            podStatus: item?.podStatus,
            note: item?.note,
          },
        });

        if (!log) {
          console.log(`create ${  item.note}`);
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
