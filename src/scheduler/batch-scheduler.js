const cron = require('node-cron');
const {
  Order,
  OrderBatch,
  OrderHistory,
  OrderDetail,
  Seller,
  SellerDetail,
} = require('../app/models');

const creditUpdater = async () => {
  const orderHistory = await OrderHistory.findAll({
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
      // isExecute: false,
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

  console.log(orderHistory.length);

  let sellerUpdateObject = Object.create(null);
  await orderHistory.forEach(async (item) => {
    if (sellerUpdateObject[item.orderDetail.seller.id] === undefined) {
      sellerUpdateObject[item.orderDetail.seller.id] = [];
      sellerUpdateObject[item.orderDetail.seller.id]['delta'] = 0;
    }
    sellerUpdateObject[item.orderDetail.seller.id]['delta'] += Number(item.deltaCredit);
    sellerUpdateObject[item.orderDetail.seller.id]['credit'] = item.orderDetail.seller.sellerDetail.credit;
    console.log(item.orderDetail.seller.id);
    // console.log(item.orderDetail.seller.sellerDetail.credit);
    console.log('total delta credit : ' + sellerUpdateObject[item.orderDetail.seller.id]['delta']);
    // sellerUpdateObject[item.orderDetail.seller.id] = item.orderDetail.seller.sellerDetail.credit;
  });


  for (const key in sellerUpdateObject) {
    let newCredit = Number(sellerUpdateObject[key]['credit']) + Number(sellerUpdateObject[key]['delta'])
    console.log(key + ' : ' + newCredit);
  }

  // console.log(Object.keys(sellerUpdateObject).length);
  // console.log(sellerUpdateObject[132]);
};
const processing = async () => {
  try {
    const batchs = await OrderBatch.findAll();
    const batchId = batchs.map((item) => item.id);
    // console.log(batchId);
    const orders = await Order.findAll({ where: { batchId } });

    batchs.forEach(async (item) => {
      const order = orders.filter((orderData) => orderData.batchId === item.id);
      // console.log('item ' + item.id);
      // console.log('total order : ' + order.length);
      const sent = order.filter((orderData) => orderData.status === 'DELIVERED');
      // console.log('sent : ' + sent.length);
      // console.log(sent.length);
      const problem = order.filter((orderData) => orderData.status === 'PROBLEM');
      const processed = order.filter((orderData) => orderData.status === 'PROCESSED');

      await OrderBatch.update(
        {
          totalOrder: order.length,
          totalOrderSent: sent.length,
          totalOrderProblem: problem.length,
          totalOrderProcessed: processed.length,
        },
        { where: { id: item.id } },
      ).then((result) => {

        // console.log('update finish : ' + item.id);
        // console.log(sent.length);
      });
    });

    console.log('batch looping finish');
  } catch (error) {
    throw new Error(error?.message);
  }
};

// every 1 hour 0 */1 * * *
const runner = cron.schedule('*/15 * * * *', async () => {
  // eslint-disable-next-line no-console
  console.info('batch scheduler run');

  try {
    await processing();
    await creditUpdater();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});

module.exports = runner;
