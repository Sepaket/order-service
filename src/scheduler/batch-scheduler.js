const cron = require('node-cron');
const {
  Order,
  OrderBatch,
} = require('../app/models');

const processing = async () => {
  try {
    const batchs = await OrderBatch.findAll();
    const batchId = batchs.map((item) => item.id);

    const orders = await Order.findAll({ where: { batchId } });

    batchs.forEach(async (item) => {
      const order = orders.filter((orderData) => orderData.batchId === item.id);
      // console.log('order' + order.id);
      const sent = order.filter((orderData) => orderData.status === 'DELIVERED');
      const problem = order.filter((orderData) => orderData.status === 'PROBLEM');
      const processed = order.filter((orderData) => orderData.status === 'PROCESSED');

      await OrderBatch.update(
        {
          totalOrderSent: sent.length,
          totalOrderProblem: problem.length,
          totalOrderProcessed: processed.length,
        },
        { where: { id: item.id } },
      );
    });
  } catch (error) {
    throw new Error(error?.message);
  }
};

// every 1 hour 0 */1 * * *
const runner = cron.schedule('*/10 * * * *', async () => {
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
