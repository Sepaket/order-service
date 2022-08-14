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
    try {
      await this.getOrders();
      return this.calculatePercentage();
    } catch (error) {
      return error;
    }
  }

  calculatePercentage() {
    let processingOrders = 0;
    this.orderList.forEach((orderList) => {
      if (orderList.status === 'RETURN_TO_SELLER') {
        // eslint-disable-next-line no-plusplus
        processingOrders++;
      }
    });

    if (this.orderList.length) {
      return (processingOrders / this.orderList.length) * 100;
    }

    return 0;
  }

  async getOrders() {
    const seller = await jwtSelector({ request: this.request });
    const orderList = await this.order.findAll({
      attributes: ['id', 'status'],
      where: {
        '$detail.seller_id$': seller.id,
        ...this.querySearch(),
      },
      include: [{
        model: OrderDetail,
        as: 'detail',
      }],
    });

    if (orderList) this.orderList = orderList;
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
