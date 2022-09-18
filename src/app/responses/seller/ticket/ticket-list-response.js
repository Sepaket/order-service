const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { Ticket, Order } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.op = Sequelize.Op;
    this.request = request;
    this.ticket = Ticket;
    this.order = Order;
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
    const total = await this.ticket.count({ where: { sellerId: seller.id } });

    return new Promise((resolve, reject) => {
      try {
        this.ticket.findAll({
          attributes: [
            ['id', 'ticket_id'],
            'title',
            'category',
            'priority',
            'status',
            'message',
            'file',
            'createdAt',
          ],
          include: [
            {
              model: this.order,
              as: 'order',
              required: true,
              attributes: [
                ['id', 'order_id'],
                'resi',
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
                  total_result: 0,
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
        title: { [this.op.substring]: query?.keyword || '' },
        category: { [this.op.substring]: query?.keyword || '' },
        message: { [this.op.substring]: query?.keyword || '' },
        status: { [this.op.substring]: query?.keyword?.toUpperCase() || '' },
      },
    };

    return condition;
  }
};
