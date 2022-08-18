const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { SellerAddress, Location } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.op = Sequelize.Op;
    this.request = request;
    this.location = Location;
    this.address = SellerAddress;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const limit = 10;
    const offset = 0;
    const { query } = this.request;
    const search = this.querySearch();
    const nextPage = (
      (parseInt(query.page, 10) - parseInt(1, 10)) * parseInt(10, 10)
    ) || parseInt(offset, 10);
    const seller = await jwtSelector({ request: this.request });
    const total = await this.address.count({ where: { sellerId: seller.id } });

    return new Promise((resolve, reject) => {
      try {
        this.address.findAll({
          attributes: [
            ['id', 'address_id'],
            'name',
            'picName',
            'picPhoneNumber',
            'address',
            'hideInResi',
            'active',
          ],
          include: [
            {
              model: this.location,
              as: 'location',
              required: false,
              attributes: [
                ['id', 'location_id'],
                'province',
                'city',
                'district',
                'subDistrict',
                'postalCode',
              ],
            },
          ],
          where: { ...search, sellerId: seller.id },
          order: [['id', 'DESC']],
          limit: parseInt(query.limit, 10) || parseInt(limit, 10),
          offset: nextPage,
        }).then((response) => {
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          const mapped = result?.map((item) => ({
            ...item,
            location: this.converter.objectToSnakeCase(item?.location) || null,
          }));

          if (mapped.length > 0) {
            resolve({
              data: mapped,
              meta: {
                total,
                total_result: mapped.length,
                limit: parseInt(query.limit, 10) || limit,
                page: parseInt(query.page, 10) || (offset + 1),
              },
            });
          } else {
            reject(httpErrors(404, 'No Data Found', {
              data: {
                data: [],
                meta: {
                  total,
                  total_result: mapped.length,
                  limit: parseInt(query.limit, 10) || limit,
                  page: parseInt(query.page, 10) || (offset + 1),
                },
              },
            }));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  querySearch() {
    const { query } = this.request;
    const condition = {
      [this.op.or]: {
        name: { [this.op.substring]: query.keyword },
        picName: { [this.op.substring]: query.keyword },
        picPhoneNumber: { [this.op.substring]: query.keyword },
        address: { [this.op.substring]: query.keyword },
        addressDetail: { [this.op.substring]: query.keyword },
      },
    };

    return query.keyword ? condition : {};
  }
};
