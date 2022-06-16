const table = 'locations';
const locations = require('../templates/location.json');

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
    queryInterface.bulkInsert(table, locations
      .filter((item) => item.ZIP_CODE !== 0)
      .map((item) => ({
        province: item.PROVINCE_NAME.toLowerCase(),
        city: item.CITY_NAME.toLowerCase(),
        district: item.DISTRICT_NAME.toLowerCase(),
        sub_district: item.SUBDISTRICT_NAME.toLowerCase(),
        postal_code: item.ZIP_CODE,
        jne_origin_code: item.JNE_ORIGIN_CODE,
        jne_destination_code: item.JNE_DESTINATION_CODE,
        sicepat_origin_code: item.SICEPAT_ORIGIN_CODE,
        sicepat_destination_code: item.SICEPAT_DESTINATION_CODE,
        ninja_origin_code: item.NINJA_ORIGIN_CODE,
        ninja_destination_code: item.NINJA_DESTINATION_CODE,
        idexpress_origin_code: item.IDEXPRESS_ORIGIN_CODE,
        idexpress_destination_code: item.IDEXPRESS_DESTINATION_CODE,
      }))),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
  ]),
};
