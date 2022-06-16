const table = 'idx_locations';
const locations = require('../templates/idx-location.json');

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
    queryInterface.bulkInsert(table, locations.map((item) => ({
      province_id: item.province_id,
      province_name: item.province_name,
      city_id: item.city_id,
      city_name: item.city_name,
      district_id: item.district_id,
      district_name: item.district_name,
    }))),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
  ]),
};
