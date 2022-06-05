const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { Province, City } = require('../../../../models');
const snakeCaseConverter = require('../../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.province = Province;
    this.city = City;
    this.op = Sequelize.Op;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const limit = 10;
    const offset = 0;
    const { query } = this.request;
    const search = this.querySearch();
    const total = await this.city.count({ where: { provinceId: query.province_id } });
    const nextPage = (
      (parseInt(query.page, 10) - parseInt(1, 10)) * parseInt(10, 10)
    ) || parseInt(offset, 10);

    return new Promise((resolve, reject) => {
      try {
        this.city.findAll({
          attributes: [
            ['id', 'city_id'],
            'name',
          ],
          include: [
            {
              model: this.province,
              as: 'province',
              required: false,
            },
          ],
          where: {
            ...search,
            [this.op.and]: {
              provinceId: { [this.op.eq]: query.province_id },
            },
          },
          order: [['name', 'ASC']],
          limit: parseInt(query.limit, 10) || parseInt(limit, 10),
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
        name: {
          [this.op.substring]: query.keyword,
        },
      },
    };

    return query.keyword ? condition : {};
  }
};
