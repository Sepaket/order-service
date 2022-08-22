const cron = require('node-cron');
const jne = require('./jne-tracking');
const sicepat = require('./sicepat-tracking');

// every 3 hour
const runner = cron.schedule('5 * * * *', async () => {
// const runner = cron.schedule('0 */3 * * *', async () => {
  // eslint-disable-next-line no-console
  console.info('tracking scheduler run');

  try {
    await jne.tracking();
    await sicepat.tracking();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});

module.exports = runner;
