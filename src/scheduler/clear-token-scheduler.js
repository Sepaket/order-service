const cron = require('node-cron');
const { deleteRedisData } = require('../helpers/redis');

const runner = cron.schedule('*/5 * * * *', async () => {
  // eslint-disable-next-line no-console
  console.info('cleaner ninja token scheduler run');

  try {
    await deleteRedisData({
      db: 3,
      key: 'ninja-token',
    });
    // await ninja.tracking();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});

module.exports = runner;
