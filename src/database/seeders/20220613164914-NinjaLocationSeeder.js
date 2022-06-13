const table = 'ninja_locations';
const provinces = require('../templates/ninja-location.json');

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
    queryInterface.bulkInsert(table, provinces.map((item) => ({
      province: item.Provinsi,
      city: item.city,
      district: item.Kecamatan,
      location_code_1: item.code_1,
      location_code_2: item.code_2,
    }))),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
  ]),
};
