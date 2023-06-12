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
  ActivityLog,
} = require('../app/models');


const saldoUpdater = async () => {

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
      note: {
        [Sequelize.Op.in]:['DELIVERED', 'RETURN_TO_SELLER'],
      },
    },
  });

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





  const dbTransaction = await sequelize.transaction()
  try {


    let updateResult = await OrderHistory.update(
      { isExecute: true },
      {
        where: {
          orderId: ids,
        },

      },
      { transaction: dbTransaction },
    );

    for (const key in sellerUpdateObject) {
      let newCredit = Number(sellerUpdateObject[key]['credit']) + Number(sellerUpdateObject[key]['delta']);
      let updateSeller = await SellerDetail.update(
        { credit: newCredit },
        {
          where: {
            sellerId: key,
          },
        },
        { transaction: dbTransaction },
      );
    }
    await dbTransaction.commit();
  } catch (error) {
    console.log(error);
    await dbTransaction.rollback();
  }


}


const creditUpdater = async () => {
  let sellerUpdateObject = Object.create(null);
  const seller_keys = Object.keys(sellerUpdateObject);
  const creditHistories = await CreditHistory.findAll({
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
              status: {
                [Sequelize.Op.in]:['COMPLETED', 'PAID'],
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
              status: {
                [Sequelize.Op.in]:['COMPLETED', 'PAID'],
              },
            }
          ]
        },

      ],

    },

  });


const historyIds = [];
  await creditHistories.forEach(async (item) => {
    historyIds.push(item.id);
    if (sellerUpdateObject[item.sellerId] === undefined) {
      sellerUpdateObject[item.sellerId] = [];
      sellerUpdateObject[item.sellerId]['delta'] = 0;
      sellerUpdateObject[item.sellerId]['ids'] = [];
      sellerUpdateObject[item.sellerId]['credit'] = 0;
      sellerUpdateObject[item.sellerId]['deltatopup'] = 0;
    }
    let deltatopup = 0;
    if(item.topup === null) {
      deltatopup -= Number(item.withdraw);
    } else {
      deltatopup += Number(item.topup);
    }

    sellerUpdateObject[item.sellerId]['deltatopup'] += Number(deltatopup);
  // console.log('credit add : ' + item.id + ' amount : ' + deltatopup);
  });


  const dbTransaction = await sequelize.transaction()
  try {


    let creditUpdateResult = await CreditHistory.update(
      { isExecute: true },
      {
        where: {
          id: historyIds,
        },
      },
      { transaction: dbTransaction },
    );

    // THIS IS FOR ACTIVITY LOG!!!
    // let activityLog = await ActivityLog.create(
    //   { action: 'credit history update'  },
    //   { transaction: dbTransaction },
    // );

    for (const key in sellerUpdateObject) {
      // let newCredit = Number(sellerUpdateObject[key]['credit']) + Number(sellerUpdateObject[key]['delta']) + Number(sellerUpdateObject[key]['deltatopup']);
      let newCredit = Number(sellerUpdateObject[key]['credit']) + Number(sellerUpdateObject[key]['deltatopup']);
      let updateSeller = await SellerDetail.update(
        { credit: newCredit },
        {
          where: {
            sellerId: key,
          },
        },
        { transaction: dbTransaction },
      );
    }
    await dbTransaction.commit();
  } catch (error) {
    console.log(error);
    await dbTransaction.rollback();
  }
  console.log('batch credit updater finish');
};




const referralUpdater = async () => {
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
      {
        model: Seller,
        as: 'referred',
        required: false,
        include: [
          {
            model: SellerDetail,
            as: 'referredDetail',
            required: false,

          },
        ],

      },
    ],
    where: {
      [Sequelize.Op.and]: [
        {
          referralBonusExecuted: {
            [Sequelize.Op.is]: false,
          },
        },
        {
          isExecute: {
            [Sequelize.Op.is]: true,
          },
        },
        {
          note: {
            [Sequelize.Op.in]: ['DELIVERED'],
          },
        }
      ],

    },
  });

  const ids = [];
  let sellerUpdateObject = Object.create(null);
  await orderHistory.forEach(async (item) => {
    ids.push(item.orderId);

    if (item.referred === null) {

        console.log(item.orderId + ' IS NULL')

    } else {
      if (sellerUpdateObject[item.referred.id] === undefined) {
        sellerUpdateObject[item.referred.id] = [];
        sellerUpdateObject[item.referred.id]['ids'] = [];
        sellerUpdateObject[item.referred.id]['delta'] = 0;
      }
      console.log('referral');
      // console.log(item.referred);
      sellerUpdateObject[item.referred.id]['delta'] += Number(item.referralCredit);
      console.log(sellerUpdateObject[item.referred.id]['delta']);
      sellerUpdateObject[item.referred.id]['credit'] = (item.referred.referredDetail.credit === 'NaN')? 0 : item.referred.referredDetail.credit;

      sellerUpdateObject[item.referred.id]['ids'].push(item.orderId);
    }


  });


  const db2Transaction = await sequelize.transaction()
  try {


    let updateResult = await OrderHistory.update(
      { referralBonusExecuted: true },
      {
        where: {
          orderId: ids,
        },

      },
      { transaction: db2Transaction },
    );

    for (const key in sellerUpdateObject) {
      console.log(key)
      console.log(sellerUpdateObject[key]);
      let newCredit = Number(sellerUpdateObject[key]['credit']) + Number(sellerUpdateObject[key]['delta']);
      let updateSeller = await SellerDetail.update(
        { credit: newCredit },
        {
          where: {
            sellerId: key,
          },
        },
        { transaction: db2Transaction },
      );
    }
    await db2Transaction.commit();
  } catch (error) {
    console.log(error);
    await db2Transaction.rollback();
  }

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

  } catch (error) {
    throw new Error(error?.message);
  }
};

// every 1 hour 0 */1 * * *
const runner = cron.schedule('*/1 * * * *', async () => {
  // eslint-disable-next-line no-console
  console.info('batch scheduler run');

  try {
    await processing();
    await saldoUpdater();
    await creditUpdater();
    await referralUpdater();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});

module.exports = runner;
