const cron = require('node-cron');
const { setRedisData } = require('../helpers/redis');
const jne = require('../helpers/jne');
const sicepat = require('../helpers/sicepat');
const ninja = require('../helpers/ninja');

const destinationJne = async () => {
  try {
    const destinations = await jne.getDestination();
    const mapped = destinations?.map((item) => ({
      name: item?.City_Name,
      code: item?.City_Code,
      type: 'jne',
    })) || [];

    return mapped;
  } catch (error) {
    throw new Error(error);
  }
};

const destinationSicepat = async () => {
  try {
    const destinations = await sicepat.getDestination();
    const mapped = destinations.map((item) => ({
      name: `${item?.province}, ${item?.city}, ${item?.subdistrict}`,
      code: item?.destination_code,
      type: 'sicepat',
    }));

    return mapped;
  } catch (error) {
    throw new Error(error);
  }
};

const destinationNinja = async () => {
  try {
    const destinations = await ninja.getDestination();
    const mapped = destinations.map((item) => ({
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
  console.info('get destination scheduler run');

  try {
    let destinations = [];
    const jneDestinations = await destinationJne();
    const sicepatDestinations = await destinationSicepat();
    const ninjaDestination = await destinationNinja();

    destinations = destinations.concat(jneDestinations);
    destinations = destinations.concat(ninjaDestination);
    destinations = destinations.concat(sicepatDestinations);

    setRedisData({
      db: 3,
      key: 'destinations',
      data: JSON.stringify(destinations),
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
