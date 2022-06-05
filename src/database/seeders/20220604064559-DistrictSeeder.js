const table = 'districts';
const districts = require('../templates/district.json');

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
    queryInterface.bulkInsert(table, districts.map((item) => ({
      id: item.subDistrictId,
      name: item.subDistrictName,
      province_id: item.provinceId,
      city_id: item.districtId,
    }))),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
  ]),
};
