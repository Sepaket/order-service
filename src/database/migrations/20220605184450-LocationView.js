const view = 'locations';
const query = `
  SELECT
    row_number() OVER () AS id,
    provinces.id as province_id,
    provinces.name as province_name,
    cities.id as city_id,
    cities.name as city_name,
    districts.id as district_id,
    districts.name as district_name,
    sub_districts.id as sub_district_id,
    sub_districts.name as sub_district_name,
    sub_districts.postal_code
  FROM
    provinces,
    cities,
    districts,
    sub_districts
  WHERE
    provinces.id = cities.province_id
  AND
    cities.id = districts.city_id
  AND
    districts.id = sub_districts.district_id
`;

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.sequelize.query(`CREATE VIEW ${view} AS ${query}`),
  ]),
  down: async (queryInterface) => Promise.all([
    queryInterface.sequelize.query(`DROP VIEW ${view}`),
  ]),
};
