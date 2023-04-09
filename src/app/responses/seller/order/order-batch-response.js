const moment = require('moment');
const httpErrors = require('http-errors');
const { Sequelize,
  Op
} = require('sequelize');
const { OrderBatch, Seller } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const jwtSelector = require('../../../../helpers/jwt-selector');

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
    const seller = await jwtSelector({ request: this.request });
    const total = await this.batch.count({ where: { sellerId: seller.id,
      totalOrder : {
        [Op.gt]: 0,
      }
      } });
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
          ],
          where: { ...search, sellerId: seller.id,
            totalOrder : {
              [Op.gt]: 0,
            }},
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
      [this.op.gt]: {
        totalOrder: 0,
      },
    };

    if (query?.date_start && query?.date_end) {
      condition.createdAt = {
        [this.op.between]: [
          moment(`${query?.date_start}`).startOf('day').format(),
          moment(`${query?.date_end}`).endOf('day').format(),
          // moment(`${query?.date_start} 23:59:59`).toISOString(),
          // moment(`${query?.date_end} 23:59:59`).toISOString(),
        ],
      };
    }

    return (query?.date_start || query?.keyword) ? condition : {};
  }
};
