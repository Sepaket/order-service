const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { Location } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.op = Sequelize.Op;
    this.request = request;
    this.location = Location;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const limit = 10000;
    const offset = 0;
    const { query } = this.request;
    const search = this.querySearch();
    const total = await this.location.count();
    const nextPage = (
      (parseInt(query.page, 10) - parseInt(1, 10)) * parseInt(10, 10)
    ) || parseInt(offset, 10);

    return new Promise((resolve, reject) => {
      try {
        this.location.findAll({
          where: search,
          limit: parseInt(query?.limit || limit, 10),
          offset: nextPage,
        }).then((response) => {
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          if (result.length > 0) {
            resolve({
              data: result,
              meta: {
                total,
                total_result: result.length,
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
                  total_result: result.length,
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
        province: {
          [this.op.substring]: query.keyword?.toLowerCase(),
        },
        city: {
          [this.op.substring]: query.keyword?.toLowerCase(),
        },
        district: {
          [this.op.substring]: query.keyword?.toLowerCase(),
        },
        subDistrict: {
          [this.op.substring]: query.keyword?.toLowerCase(),
        },
        postalCode: {
          [this.op.substring]: `${query.keyword?.toLowerCase()}`,
        },
      },
    };

    return query.keyword ? condition : {};
  }
};
