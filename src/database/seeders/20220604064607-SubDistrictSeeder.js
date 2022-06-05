const table = 'sub_districts';
const subDistricts1 = require('../templates/sub-district-1.json');
const subDistricts2 = require('../templates/sub-district-2.json');
const subDistricts3 = require('../templates/sub-district-3.json');
const subDistricts4 = require('../templates/sub-district-4.json');
const subDistricts5 = require('../templates/sub-district-5.json');
const subDistricts6 = require('../templates/sub-district-6.json');
const subDistricts7 = require('../templates/sub-district-7.json');
const subDistricts8 = require('../templates/sub-district-8.json');
const subDistricts9 = require('../templates/sub-district-9.json');

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
    queryInterface.bulkInsert(table, subDistricts1.map((item) => ({
      id: item.villageId,
      name: item.villageName,
      province_id: item.provinceId,
      city_id: item.districtId,
      district_id: item.subDistrictId,
      postal_code: parseInt(item.postalCode, 10),
    }))),
    queryInterface.bulkInsert(table, subDistricts2.map((item) => ({
      id: item.villageId,
      name: item.villageName,
      province_id: item.provinceId,
      city_id: item.districtId,
      district_id: item.subDistrictId,
      postal_code: parseInt(item.postalCode, 10),
    }))),
    queryInterface.bulkInsert(table, subDistricts3.map((item) => ({
      id: item.villageId,
      name: item.villageName,
      province_id: item.provinceId,
      city_id: item.districtId,
      district_id: item.subDistrictId,
      postal_code: parseInt(item.postalCode, 10),
    }))),
    queryInterface.bulkInsert(table, subDistricts4.map((item) => ({
      id: item.villageId,
      name: item.villageName,
      province_id: item.provinceId,
      city_id: item.districtId,
      district_id: item.subDistrictId,
      postal_code: parseInt(item.postalCode, 10),
    }))),
    queryInterface.bulkInsert(table, subDistricts5.map((item) => ({
      id: item.villageId,
      name: item.villageName,
      province_id: item.provinceId,
      city_id: item.districtId,
      district_id: item.subDistrictId,
      postal_code: parseInt(item.postalCode, 10),
    }))),
    queryInterface.bulkInsert(table, subDistricts6.map((item) => ({
      id: item.villageId,
      name: item.villageName,
      province_id: item.provinceId,
      city_id: item.districtId,
      district_id: item.subDistrictId,
      postal_code: parseInt(item.postalCode, 10),
    }))),
    queryInterface.bulkInsert(table, subDistricts7.map((item) => ({
      id: item.villageId,
      name: item.villageName,
      province_id: item.provinceId,
      city_id: item.districtId,
      district_id: item.subDistrictId,
      postal_code: parseInt(item.postalCode, 10),
    }))),
    queryInterface.bulkInsert(table, subDistricts8.map((item) => ({
      id: item.villageId,
      name: item.villageName,
      province_id: item.provinceId,
      city_id: item.districtId,
      district_id: item.subDistrictId,
      postal_code: parseInt(item.postalCode, 10),
    }))),
    queryInterface.bulkInsert(table, subDistricts9.map((item) => ({
      id: item.villageId,
      name: item.villageName,
      province_id: item.provinceId,
      city_id: item.districtId,
      district_id: item.subDistrictId,
      postal_code: parseInt(item.postalCode, 10),
    }))),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
  ]),
};
