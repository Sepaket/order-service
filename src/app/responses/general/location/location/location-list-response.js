const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const snakeCaseConverter = require('../../../../../helpers/snakecase-converter');
const {
  Province,
  City,
  District,
  SubDistrict,
} = require('../../../../models');

module.exports = class {
  constructor({ request }) {
    this.province = Province;
    this.city = City;
    this.district = District;
    this.subDistrict = SubDistrict;
    this.op = Sequelize.Op;
    this.request = request;
    this.converter = snakeCaseConverter;

    return this.process();
  }

  async process() {
    return new Promise(async (resolve, reject) => {
      try {
        let result = [];
        const limit = 10;
        const offset = 0;
        const { query } = this.request;
        const search = this.querySearch();
        const nextPage = (
          (parseInt(query.page, 10) - parseInt(1, 10)) * parseInt(10, 10)
        ) || parseInt(offset, 10);

        const provinces = await this.province.findAll({
          order: [['name', 'ASC']],
          where: search,
          limit: parseInt(query.limit, 10) || parseInt(limit, 10),
          offset: nextPage,
        });

        const cities = await this.city.findAll({
          order: [['name', 'ASC']],
          where: search,
          limit: parseInt(query.limit, 10) || parseInt(limit, 10),
          offset: nextPage,
        });

        const districts = await this.district.findAll({
          order: [['name', 'ASC']],
          where: search,
          limit: parseInt(query.limit, 10) || parseInt(limit, 10),
          offset: nextPage,
        });

        const subdistricts = await this.subDistrict.findAll({
          attributes: [
            ['id', 'sub_district_id'],
            'name',
            'postalCode',
          ],
          order: [['name', 'ASC']],
          where: search,
          limit: parseInt(query.limit, 10) || parseInt(limit, 10),
          offset: nextPage,
        });

        const provinceMap = provinces?.map((item) => ({ type: 'province', name: item?.name, province_id: item?.id })) || [];
        const cityMap = cities?.map((item) => ({
          type: 'city',
          name: item?.name,
          city_id: item?.id,
          province_id: item?.provinceId,
        })) || [];

        const districtMap = districts?.map((item) => ({
          type: 'district',
          name: item?.name,
          district_id: item?.id,
          city_id: item?.cityId,
          province_id: item?.provinceId,
        })) || [];

        const subDistrictMap = subdistricts?.map((item) => ({
          type: 'sub_district',
          name: item?.name,
          sub_district_id: item?.id,
          city_id: item?.cityId,
          province_id: item?.provinceId,
          district_id: item?.districtId,
          postal_code: item?.postalCode,
        })) || [];

        result = result.concat(provinceMap);
        result = result.concat(cityMap);
        result = result.concat(districtMap);
        result = result.concat(subDistrictMap);

        const mapped = result?.map((location) => {
          if (location?.province_id) {

          }
        });

        // console.log(provinces?.length, 'province');
        // console.log(cities?.length, 'city');
        // console.log(districts?.length, 'district');
        // console.log(subdistricts?.length, 'subdistrict');
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  querySearch() {
    const { query } = this.request;
    const condition = {
      [this.op.or]: {
        name: {
          [this.op.substring]: query.keyword,
        },
      },
    };

    return query.keyword ? condition : {};
  }
};
