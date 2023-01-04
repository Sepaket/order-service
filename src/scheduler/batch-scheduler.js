const cron = require('node-cron');
const { Sequelize } = require('sequelize');
const {
  Order,
  OrderBatch,
  OrderHistory,
  OrderDetail,
  CreditHistory,
  Seller,
  SellerDetail,
  sequelize,
} = require('../app/models');



const creditUpdater = async () => {

  // const t = await sequelize.transaction();

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




  console.log('order history legth : ' + orderHistory.length);
const ids = [];
  let sellerUpdateObject = Object.create(null);
  await orderHistory.forEach(async (item) => {
    ids.push(item.orderId);
    if (sellerUpdateObject[item.orderDetail.seller.id] === undefined) {
      sellerUpdateObject[item.orderDetail.seller.id] = [];
      sellerUpdateObject[item.orderDetail.seller.id]['delta'] = 0;
      sellerUpdateObject[item.orderDetail.seller.id]['ids'] = [];
      sellerUpdateObject[item.orderDetail.seller.id]['credit'] = 0;
      sellerUpdateObject[item.orderDetail.seller.id]['deltatopup'] = 0;
    }
    sellerUpdateObject[item.orderDetail.seller.id]['delta'] += Number(item.deltaCredit);
    sellerUpdateObject[item.orderDetail.seller.id]['credit'] = (item.orderDetail.seller.sellerDetail.credit === 'NaN')? 0 : item.orderDetail.seller.sellerDetail.credit;
    sellerUpdateObject[item.orderDetail.seller.id]['ids'].push(item.orderId);

  });




  const seller_keys = Object.keys(sellerUpdateObject);
  console.log('Seller keys from orderhistories yang belum ter proses : ');
  console.log(seller_keys);
  const creditHistories = await CreditHistory.findAll({
    include: [

    ],

    where: {
      [Sequelize.Op.or]: [
        {
          [Sequelize.Op.and]: [
            {
              is_execute: {
                [Sequelize.Op.is]: null,
              },
            },
            {
              seller_id: {
                [Sequelize.Op.in]:seller_keys,
              },
            }
          ]
        },

        {
          [Sequelize.Op.and]: [
            {
              is_execute: {
                [Sequelize.Op.is]: false,
              },
            },
            {
              seller_id: {
                [Sequelize.Op.in]:seller_keys,
              },
            }
          ]
        },

      ],

    },

  });

  console.log('creadit histori reno : ' + creditHistories.length);
  // console.log();

const historyIds = [];
  await creditHistories.forEach(async (item) => {
    historyIds.push(item.id);
    // console.log(item.id);
    let deltatopup = 0;
    if(item.topup === null) {
      deltatopup -= Number(item.withdraw);
    } else {
      deltatopup += Number(item.topup);
    }


//     console.log('current credit : '  + item.sellerId + ' : ' + Number(sellerUpdateObject[item.sellerId]['credit']));
//     console.log('credit delta : '  + item.sellerId + ' : ' + Number(sellerUpdateObject[item.sellerId]['delta']));
//     console.log('topup : '  + item.sellerId + ' : ' + item.topup);
//     console.log('withdraw : '  + item.sellerId + ' : ' + item.withdraw);
// console.log('delta topup : '  + item.sellerId + ' : ' + deltatopup);
// console.log(" ");
    sellerUpdateObject[item.sellerId]['deltatopup'] += Number(deltatopup);
    // console.log('result : ');
    // console.log(updateResult);

    // try {
    //   await t.commit();
    // } catch (error) {
    //   // await t.rollback();
    //   console.log(error);
    // }


  });




  let updateResult = await OrderHistory.update(
      { isExecute: true },
      {
        where: {
          orderId: ids,
        },

      },
      // {
      //   transaction: t,
      // },
    );

  let creditUpdateResult = await CreditHistory.update(
    { isExecute: true },
    {
      where: {
        id: historyIds,
      },

    },
    // {
    //   transaction: t,
    // },
  );




  for (const key in sellerUpdateObject) {
  let newCredit = Number(sellerUpdateObject[key]['credit']) + Number(sellerUpdateObject[key]['delta']) + Number(sellerUpdateObject[key]['deltatopup']);
console.log ('new credit ' + key + ' : ' + newCredit + ' : ' + sellerUpdateObject[key]['deltatopup']);
    let updateSeller = await SellerDetail.update(
      { credit: newCredit },
      {
        where: {
          sellerId: key,
        },

      },
      // {
      //   transaction: t,
      // },
    );

  }



  console.log('batch credit updater finish');
};
const processing = async () => {
  try {
    const batchs = await OrderBatch.findAll();
    const batchId = batchs.map((item) => item.id);
    const orders = await Order.findAll({ where: { batchId } });

    batchs.forEach(async (item) => {
      const order = orders.filter((orderData) => orderData.batchId === item.id);
      const sent = order.filter((orderData) => orderData.status === 'DELIVERED');
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
