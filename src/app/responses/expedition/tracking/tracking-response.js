const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const jwtSelector = require('../../../../helpers/jwt-selector');
const {
  Order,
  OrderDetail,
  OrderLog,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.order = Order;
    this.op = Sequelize.Op;
    this.request = request;
    this.orderLog = OrderLog;
    this.orderDetail = OrderDetail;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const { body } = this.request;
    const seller = await jwtSelector({ request: this.request });

    return new Promise((resolve, reject) => {
      try {
        this.orderDetail.findOne({
          include: [
            {
              model: this.order,
              as: 'order',
              required: true,
              where: {
                resi: body.resi,
              },
            },
          ],
          where: {
            sellerId: seller.id,
          },
        }).then(async (response) => {
          const statuses = await this.orderLog.findAll({
            order: [['id', 'ASC']],
            attributes: [
              ['id', 'status_id'],
              'note',
              'orderId',
              'previousStatus',
              'currentStatus',
              'createdAt',
            ],
            where: {
              orderId: response.orderId,
            },
          });

          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(statuses)),
          );

          if (statuses?.length > 0) resolve(result);
          else reject(httpErrors(404, 'No Data Found', { data: null }));
        });
      } catch (error) {
        reject(error);
      }
    });
  }
};
