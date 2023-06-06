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

    const orderResponse = [
      {
        key: 'waiting_for_pickup',
        count: 9
      },
      {
        key: 'cod_processing_total',
        count: 9
      },
      {
        key: 'non_cod_processing_total',
        count: 9
      },
      {
        key: 'cod_sent_total',
        count: 9
      },
      {
        key: 'non_cod_sent_total',
        count: 9
      },
      {
        key: 'return_to_seller',
        count: 9
      },
      {
        key: 'total_order',
        count: 9
      },
      {
        key: 'percentage_processing',
        count: 9
      },
      {
        key: 'need_attention',
        count: 9
      },
      {
        key: 'rate_return',
        count: 9
      },
      {
        key: 'rate_success',
        count: 9
      },
    ];

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
