const cron = require('node-cron');
const {
  Order,
  OrderBatch,
} = require('../app/models');

const processing = async () => {
  try {
    const batchs = await OrderBatch.findAll();
    const batchId = batchs.map((item) => item.id);
    // console.log(batchId);
    const orders = await Order.findAll({ where: { batchId : batchId } });

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
          totalOrder : order.length,
          totalOrderSent: sent.length,
          totalOrderProblem: problem.length,
          totalOrderProcessed: processed.length,
        },
        { where: { id: item.id } },
      ).then(result => {

          // console.log('update finish : ' + item.id);
          // console.log(sent.length);
      }

      );
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});

module.exports = runner;
