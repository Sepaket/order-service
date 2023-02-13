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

const { setRedisData, getRedisData } = require('../../../../helpers/redis');

const authExpireCheck = async () => {

};

const authRefresh = async () => {

};

// every 1 hour 0 */1 * * *
const routines = cron.schedule('*/10 * * * *', async () => {
  // eslint-disable-next-line no-console
  console.info('ninja scheduler run');

  try {
    // await processing();
    // await saldoUpdater();
    // await creditUpdater();
    // await referralUpdater();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});

const authRoutines = cron.schedule('*/10 * * * *', async () => {
  // eslint-disable-next-line no-console
  console.info('ninja scheduler run');

  try {
    await authExpireCheck();
    await authRefresh();
    // await processing();
    // await saldoUpdater();
    // await creditUpdater();
    // await referralUpdater();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});

module.exports = {
  routines,
  authRoutines,
};
