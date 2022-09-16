const moment = require('moment');
const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { OrderBatch, OrderDetail, Seller } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.op = Sequelize.Op;
    this.request = request;
    this.batch = OrderBatch;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const limit = 10;
    const offset = 0;
    const { query } = this.request;
    const search = this.querySearch();
    const total = await this.batch.count({ where: { ...search } });
    const nextPage = (
      (parseInt(query.page, 10) - parseInt(1, 10)) * parseInt(10, 10)
    ) || parseInt(offset, 10);

    return new Promise((resolve, reject) => {
      try {
        this.batch.findAll({
          attributes: [
            ['id', 'batch_id'],
            'expedition',
            'batchCode',
            'totalOrder',
            'totalOrderProcessed',
            'totalOrderSent',
            'totalOrderProblem',
            'createdAt',
          ],
          include: [
            {
              model: this.seller,
              as: 'seller',
              required: true,
              attributes: [
                ['id', 'seller_id'],
                'name',
              ],
            },
            {
              model: OrderDetail,
              as: 'orderDetail',
              required: true,
              attributes: ['id'],
            },
          ],
          where: { ...search },
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
        batchCode: { [this.op.substring]: query?.keyword || '' },
      },
    };

    if (query?.date_start && query?.date_end) {
      condition.createdAt = {
        [this.op.between]: [
          moment(`${query?.date_start}`).startOf('day').format(),
          moment(`${query?.date_end}`).endOf('day').format(),
        ],
      };
    }

    return (query?.date_start || query?.keyword) ? condition : {};
  }
};
