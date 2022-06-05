const table = 'cities';
const cities = require('../templates/city.json');

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
    queryInterface.bulkInsert(table, cities.map((item) => ({
      id: item.districtId,
      name: item.districtName,
      province_id: item.provinceId,
    }))),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
  ]),
};
