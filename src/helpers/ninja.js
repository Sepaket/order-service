const { NinjaLocation } = require('../app/models');

const getOrigin = () => new Promise(async (resolve, reject) => {
  try {
    const locations = NinjaLocation;
    const response = await locations.findAll();

    resolve(response);
  } catch (error) {
    reject(new Error(`Ninja: ${error?.message || 'Something Wrong'}`));
  }
});

const getDestination = () => new Promise(async (resolve, reject) => {
  try {
    const locations = NinjaLocation;
    const response = await locations.findAll();

    resolve(response);
  } catch (error) {
    reject(new Error(`Ninja: ${error?.message || 'Something Wrong'}`));
  }
});

module.exports = {
  getOrigin,
  getDestination,
};
