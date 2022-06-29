const cron = require('node-cron');
const { setRedisData } = require('../helpers/redis');
const jne = require('../helpers/jne');
const sicepat = require('../helpers/sicepat');
const ninja = require('../helpers/ninja');

const originJne = async () => {
  try {
    const origins = await jne.getOrigin();
    const mapped = origins?.map((item) => ({
      name: item?.City_Name,
      code: item?.City_Code,
      type: 'jne',
    })) || [];

    return mapped;
  } catch (error) {
    throw new Error(error);
  }
};

const originSicepat = async () => {
  try {
    const origins = await sicepat.getOrigin();
    const mapped = origins.map((item) => ({
      name: item?.origin_name,
      code: item?.origin_code,
      type: 'sicepat',
    }));

    return mapped;
  } catch (error) {
    throw new Error(error);
  }
};

const originNinja = async () => {
  try {
    const origins = await ninja.getOrigin();
    const mapped = origins.map((item) => ({
      name: `${item?.province}, ${item?.city}, ${item?.district}`,
      code: [item.locationCode_1, item.locationCode_2],
      type: 'ninja',
    }));

    return mapped;
  } catch (error) {
    throw new Error(error);
  }
};

const runner = cron.schedule('30 * * * *', async () => {
  // eslint-disable-next-line no-console
  console.info('get origin scheduler run');

  try {
    let origins = [];
    const jneOrigins = await originJne();
    const sicepatOrigins = await originSicepat();
    const ninjaOrigin = await originNinja();

    origins = origins.concat(jneOrigins);
    origins = origins.concat(ninjaOrigin);
    origins = origins.concat(sicepatOrigins);

    setRedisData({
      db: 2,
      key: 'origins',
      data: JSON.stringify(origins),
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
