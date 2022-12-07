const cron = require('node-cron');
const jne = require('./jne-tracking');
const sicepat = require('./sicepat-tracking');

// every 3 hour 0 */3 * * *
// every 2 mis for debugging */2 * * * *
const runner = cron.schedule('0 */3 * * *', async () => {
  // eslint-disable-next-line no-console
  console.info('tracking scheduler run');

  try {
    await jne.tracking();
    // await sicepat.tracking();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});

module.exports = runner;
