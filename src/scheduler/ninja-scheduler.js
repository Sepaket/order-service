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
const ninja = require('../helpers/ninja');

const { setRedisData, getRedisData } = require('../helpers/redis');

const authExpireCheck = async () => {
  console.log('NINJA auth expire check');

  // const getOrigin = ninja.getOrigin()
  const redisNinjaToken = await ninja.getLocalToken();
  console.log(`Redis Ninja token :  ${ninjaToken}`);

  // if (redisNinjaToken === null) {
  //   console.log('VALID IS NULL');
  //   setRedisData(
  //     {
  //       db: 0,
  //       key: 'ninja_token',
  //       timeout: 300,
  //       data: 'this is ninja token',
  //     },
  //   );
  // } else {
  //   console.log(redisNinjaToken);
  // }
};

const authRefresh = async () => {

};

// every 1 hour 0 */1 * * *
const routines = cron.schedule('*/10 * * * *', async () => {
  // eslint-disable-next-line no-console
  // console.info('ninja scheduler run');

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

const authRoutines = cron.schedule('*/1 * * * *', async () => {
  // eslint-disable-next-line no-console
  // console.info('ninja scheduler AUTH run');

  try {
    // await authExpireCheck();
    // await authRefresh();
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
