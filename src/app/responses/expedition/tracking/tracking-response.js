const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const jwtSelector = require('../../../../helpers/jwt-selector');
const {
  Order,
  OrderDetail,
  OrderLog,
  TrackingHistory,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.order = Order;
    this.op = Sequelize.Op;
    this.request = request;
    this.orderLog = OrderLog;
    this.orderDetail = OrderDetail;
    this.converter = snakeCaseConverter;
    this.trackingHistory = TrackingHistory;
    return this.process();
  }

  async process() {
    const { body } = this.request;
    const seller = await jwtSelector({ request: this.request });
    // console.log(seller);
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
            {
              model: this.trackingHistory,
              as: 'tracking',
              required: false,
              attributes: [
                'cnote_raw',
                'detail_raw',
                'history_raw',
                'cnote_pod_date',
                'cnote_pod_status',
                'cnote_pod_code',
                'cnote_last_status',
                'cnote_estimate_delivery',
                'createdAt',
                'updatedAt',
                'deletedAt',
              ],
            },
          ],
          where: {
            sellerId: seller.id,
          },
        }).then(async (response) => {
          // console.log(response);
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
            JSON.parse(JSON.stringify(response)),
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
