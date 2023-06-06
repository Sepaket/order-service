const moment = require('moment');
const { Op } = require('sequelize');
const { Order, OrderDetail } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.order = Order;
    return this.process();
  }

  async process() {
    const seller = await jwtSelector({ request: this.request });

    const orderResponse = {
      waiting_for_pickup: 9,
      cod_processing_total: 9,
      non_cod_processing_total: 9,
      cod_sent_total: 9,
      non_cod_sent_total: 9,
      return_to_seller: 9,
      total_order: 9,
      percentage_processing: 9,
      need_attention: 9,
      rate_return: 9,
      rate_success: 9,
    };

    return orderResponse;
    return new Promise(async (resolve, reject) => {
      try {
        this.seller = await jwtSelector({ request: this.request });
        this.order.count({
          where: {
            '$detail.seller_id$': seller.id,
            status: 'WAITING_PICKUP',
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
