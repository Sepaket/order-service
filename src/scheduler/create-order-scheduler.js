const cron = require('node-cron');
const sicepat = require('../helpers/sicepat');
const ninja = require('../helpers/ninja');
const jne = require('../helpers/jne');
const errorCatcher = require('../helpers/error-catcher');
const { OrderBackground } = require('../app/models');

const sicepatExecutor = async (payload) => {
  try {
    const created = await sicepat.createOrder(JSON.parse(payload.parameter));

    if (created.status) {
      await OrderBackground.update(
        { isExecute: true },
        { where: { id: payload.id } },
      );
    } else {
      await errorCatcher({
        id: payload.id,
        expedition: payload.expedition,
        subject: 'CREATE ORDER',
        ...created,
      });
    }
  } catch (error) {
    throw new Error(error?.message);
  }
};

const jneExecutor = async (payload) => {
  try {
    console.log('jne executor');
    // console.log(payload.id);
    const created = await jne.createOrder(JSON.parse(payload.parameter));
    // console.log(created);
    console.log(payload.resi);
    if (created.status) {

      // if (payload.resi === 'SPKET00008018119') {
      //   if (payload.resi === 'SPKET00008012398') {
        console.log('SUCCESSS');
      // }
      // console.log(created.status);
      await OrderBackground.update(
        { isExecute: true },
        { where: { id: payload.id } },
      );
    } else {
      // if (payload.resi === 'SPKET00008018119') {
      //   if (payload.resi === 'SPKET00008012398') {
        console.log('error status');
        // console.log(payload.resi);
        // console.log(created);
        // console.log(payload.parameter);

      // }

      // await errorCatcher({
      //   id: payload.id,
      //   expedition: payload.expedition,
      //   subject: 'CREATE ORDER',
      //   ...created,
      // });
    }
  } catch (error) {
    throw new Error(error?.message);
  }
};

const ninjaExecutor = async (payload) => {
  try {
    const created = await ninja.createOrder(JSON.parse(payload.parameter));

    if (created.status) {
      await OrderBackground.update(
        { isExecute: true },
        { where: { id: payload.id } },
      );
    } else {
      await errorCatcher({
        id: payload.id,
        expedition: payload.expedition,
        subject: 'CREATE ORDER',
        ...created,
      });
    }
  } catch (error) {
    throw new Error(error?.message);
  }
};

const runner = cron.schedule('*/3 * * * *', async () => {
  // eslint-disable-next-line no-console
  console.info('create order scheduler run');

  try {
    const orders = await OrderBackground.findAll({
      where: { isExecute: false },
      limit: 100,
    });

    orders?.forEach((item, index) => {
      setTimeout(async () => {
        // if (item.expedition === 'SICEPAT') await sicepatExecutor(item);
        if (item.expedition === 'JNE') await jneExecutor(item);
        // if (item.expedition === 'NINJA') await ninjaExecutor(item);
      }, index * 20000);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('pesan error : ');
    console.log(error.message);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});

module.exports = runner;
