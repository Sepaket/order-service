const moment = require('moment');
const { Op } = require('sequelize');
const { Order, OrderDetail } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');
const sequelize = require('sequelize');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.order = Order;
    return this.process();
  }

  async process() {
    const seller = await jwtSelector({ request: this.request });
    return new Promise(async (resolve, reject) => {
      try {
        this.seller = await jwtSelector({ request: this.request });

        this.order.findAll({
          attributes: [
            'id', 'batchId', 'orderCode', 'resi', 'expedition', 'serviceCode',
            sequelize.literal(['COALESCE(detail.id, 0) + COALESCE(detail.id, 0)'], 'total'),
          //   [sequelize.fn('COUNT', sequelize.col('detail.batchId')), 'batchID_count'] // To add the aggregation...
          ],
          where: {
            '$detail.seller_id$': seller.id,
            status: {
              [Op.or]: ['PROCESSED', 'WAITING_PICKUP']
            },
            // status: 'PROCESSED',
            isCod: false,
            ...this.querySearch(),
          },
          include: [{
            model: OrderDetail,
            as: 'detail',
          }],
        }).then((response) => {
          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  querySearch() {
    const { query } = this.request;
    if (query.start_date && query.end_date) {
      const condition = {
        createdAt: {
          [Op.between]: [
            moment(query.start_date).startOf('day').format(),
            moment(query.end_date).endOf('day').format(),
          ],
        },
      };

      return condition;
    }

    return {};
  }
};
