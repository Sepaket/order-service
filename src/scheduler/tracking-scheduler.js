const cron = require('node-cron');
const jne = require('./jne-tracking');
const sicepat = require('./sicepat-tracking');

// every 3 hour 0 */3 * * *
// every 1 mis for debugging */2 * * * *
const runner = cron.schedule('*/15 * * * *', async () => {
  // eslint-disable-next-line no-console
  console.info('tracking scheduler run');

  try {
    await jne.tracking();
    // await jne.force_retracking();
    // await sicepat.tracking();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('tracking error : ' + error.message);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});

module.exports = runner;
