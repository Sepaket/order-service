const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Admin } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.admin = Admin;
    this.request = request;
    this.op = Sequelize.Op;
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
    const total = await this.admin.count({ where: search });

    return new Promise((resolve, reject) => {
      this.admin.findAll({
        attributes: [
          'id',
          'name',
          'email',
          'role',
        ],
        where: search,
        order: [['id', 'DESC']],
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
      }).catch((error) => {
        reject(error);
      });
    });
  }

  querySearch() {
    const { query } = this.request;
    const condition = {
      [this.op.or]: {
        name: {
          [this.op.iLike]: `%${query.keyword}%`,
        },
        email: {
          [this.op.iLike]: `%${query.keyword}%`,
        },
      },
    };

    return query.keyword ? condition : {};
  }
};
