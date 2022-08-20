const cron = require('node-cron');
const sicepat = require('../helpers/sicepat');
const ninja = require('../helpers/ninja');
const jne = require('../helpers/jne');
const errorCatcher = require('../helpers/error-catcher');
const { OrderCanceled } = require('../app/models');

const sicepatExecutor = async (payload) => {
  try {
    const canceled = await sicepat.cancel(JSON.parse(payload.parameter));

    if (canceled.status) {
      await OrderCanceled.update(
        { isExecute: true },
        { where: { id: payload.id } },
      );
    } else {
      await errorCatcher({
        id: payload.id,
        expedition: payload.expedition,
        subject: 'CANCEL',
        ...canceled,
      });
    }
  } catch (error) {
    throw new Error(error?.message);
  }
};

const jneExecutor = async (payload) => {
  try {
    const canceled = await jne.cancel(JSON.parse(payload.parameter));
    if (canceled.status) {
      await OrderCanceled.update(
        { isExecute: true },
        { where: { id: payload.id } },
      );
    } else {
      await errorCatcher({
        id: payload.id,
        expedition: payload.expedition,
        subject: 'CANCEL',
        ...canceled,
      });
    }
  } catch (error) {
    throw new Error(error?.message);
  }
};

const ninjaExecutor = async (payload) => {
  try {
    const canceled = await ninja.cancel(JSON.parse(payload.parameter));

    if (canceled.status) {
      await OrderCanceled.update(
        { isExecute: true },
        { where: { id: payload.id } },
      );
    } else {
      await errorCatcher({
        id: payload.id,
        expedition: payload.expedition,
        subject: 'CANCEL',
        ...canceled,
      });
    }
  } catch (error) {
    throw new Error(error?.message);
  }
};

const runner = cron.schedule('0 */1 * * *', async () => {
  // eslint-disable-next-line no-console
  console.info('cancel scheduler run');

  try {
    const orders = await OrderCanceled.findAll({
      where: { isExecute: false },
      limit: 100,
    });

    orders?.forEach((item, index) => {
      setTimeout(async () => {
        if (item.expedition === 'SICEPAT') await sicepatExecutor(item);
        if (item.expedition === 'JNE') await jneExecutor(item);
        if (item.expedition === 'NINJA') await ninjaExecutor(item);
      }, index * 20000);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});

module.exports = runner;
