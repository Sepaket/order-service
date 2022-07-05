const table = 'locations';
// const locations = require('../templates/location.json');

module.exports = {
  up: async () => Promise.resolve(),
  // up: async (queryInterface) => Promise.all([
  //   queryInterface.bulkDelete(table, null, { truncate: true }),
  //   queryInterface.bulkInsert(table, locations
  //     .filter((item) => item.ZIP_CODE !== 0)
  //     .map((item) => {
  //       const sicepatOriginCode = item.SICEPAT_ORIGIN_CODE?.includes('n.a')
  //         ? item.SICEPAT_ORIGIN_CODE?.replace('n.a', '')
  //         : item.SICEPAT_ORIGIN_CODE;
  //
  //       const sicepatDestinationCode = item.SICEPAT_DESTINATION_CODE?.includes('n.a')
  //         ? item.SICEPAT_DESTINATION_CODE?.replace('n.a', '')
  //         : item.SICEPAT_DESTINATION_CODE;
  //
  //      const ninjaCode = `
  //        ${item.NINJA_LOCATION_1}${item.NINJA_LOCATION_1 !== ''
  //            ? ','
  //            : ''}${item.NINJA_LOCATION_2}
  //       `;
  //
  //       return {
  //         province: item.PROVINCE_NAME.toLowerCase(),
  //         city: item.CITY_NAME.toLowerCase(),
  //         district: item.DISTRICT_NAME.toLowerCase(),
  //         sub_district: item.SUBDISTRICT_NAME.toLowerCase(),
  //         postal_code: item.ZIP_CODE,
  //         jne_origin_code: item.JNE_ORIGIN_CODE,
  //         jne_destination_code: item.JNE_DESTINATION_CODE,
  //         sicepat_origin_code: sicepatOriginCode,
  //         sicepat_destination_code: sicepatDestinationCode,
  //         ninja_origin_code: ninjaCode,
  //         ninja_destination_code: ninjaCode,
  //         idexpress_origin_code: item.IDEXPRESS_ORIGIN_CODE,
  //         idexpress_destination_code: item.IDEXPRESS_DESTINATION_CODE,
  //       };
  //     })),
  // ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
  ]),
};
