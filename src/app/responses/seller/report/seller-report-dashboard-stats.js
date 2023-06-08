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
    const waiting_for_pickup = await this.waiting_for_pickup()
    const cod_processing_total = await this.cod_processing_total()
    const non_cod_processing_total = await this.non_cod_processing_total()
    const cod_sent_total = await this.cod_sent_total()
    const non_cod_sent_total = await this.non_cod_sent_total()
    const return_to_seller_total = await this.return_to_seller_total()
    const total_order = await this.order_total()
    const need_attention_total = await this.problem_total()
    const delivered_total = await this.delivered_total()
    const percentage_processing = (cod_processing_total + non_cod_processing_total) / total_order


    const rate_return = return_to_seller_total / total_order
    const rate_success = delivered_total / total_order
    const orderResponse = {
      waiting_for_pickup: waiting_for_pickup,
      cod_processing_total: cod_processing_total,
      non_cod_processing_total: non_cod_processing_total,
      cod_sent_total: cod_sent_total,
      non_cod_sent_total: non_cod_sent_total,
      return_to_seller: return_to_seller_total,
      delivered_total: delivered_total,
      total_order: total_order,
      percentage_processing: percentage_processing,
      need_attention: need_attention_total,
      rate_return: rate_return,
      rate_success: rate_success,
    };

    return orderResponse;
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

  async waiting_for_pickup() {
    this.seller = await jwtSelector({ request: this.request });
    const response = await this.order.count({
      where: {
        '$detail.seller_id$': this.seller.id,
        status: 'WAITING_PICKUP',
        ...this.querySearch(),
      },
      include: [{
        model: OrderDetail,
        as: 'detail',
      }],
    });

    return response;
  }


  async cod_processing_total() {
    this.seller = await jwtSelector({ request: this.request });
    const response = await this.order.count({
      where: {
        '$detail.seller_id$': this.seller.id,
        is_cod: true,
        status: {
          [Op.in]: [
            'PROCESSED', 'WAITING_PICKUP'
          ],
        },

      },
      include: [{
        model: OrderDetail,
        as: 'detail',
      }],
    });

    return response;
  }

  async non_cod_processing_total() {
    this.seller = await jwtSelector({ request: this.request });
    const response = await this.order.count({
      where: {
        '$detail.seller_id$': this.seller.id,
        is_cod: false,
        status: {
          [Op.in]: [
            'PROCESSED', 'WAITING_PICKUP'
          ],
        },

      },
      include: [{
        model: OrderDetail,
        as: 'detail',
      }],
    });

    return response;
  }


  async cod_sent_total() {
    this.seller = await jwtSelector({ request: this.request });
    const response = await this.order.count({
      where: {
        '$detail.seller_id$': this.seller.id,
        is_cod: true,
        status: {
          [Op.in]: [
            'DELIVERED'
          ],
        },
      },
      include: [{
        model: OrderDetail,
        as: 'detail',
      }],
    });
    return response;
  }

  async non_cod_sent_total() {
    this.seller = await jwtSelector({ request: this.request });
    const response = await this.order.count({
      where: {
        '$detail.seller_id$': this.seller.id,
        is_cod: false,
        status: {
          [Op.in]: [
            'DELIVERED'
          ],
        },
      },
      include: [{
        model: OrderDetail,
        as: 'detail',
      }],
    });
    return response;
  }

  async return_to_seller_total() {
    this.seller = await jwtSelector({ request: this.request });
    const response = await this.order.count({
      where: {
        '$detail.seller_id$': this.seller.id,
        status: {
          [Op.in]: [
            'RETURN_TO_SELLER'
          ],
        },
      },
      include: [{
        model: OrderDetail,
        as: 'detail',
      }],
    });
    return response;
  }
  async order_total() {
    this.seller = await jwtSelector({ request: this.request });
    const response = await this.order.count({
      where: {
        '$detail.seller_id$': this.seller.id,
        // status: {
        //   [Op.in]: [
        //     'RETURN_TO_SELLER'
        //   ],
        // },
      },
      include: [{
        model: OrderDetail,
        as: 'detail',
      }],
    });
    return response;
  }

  async problem_total() {
    this.seller = await jwtSelector({ request: this.request });
    const response = await this.order.count({
      where: {
        '$detail.seller_id$': this.seller.id,
        status: {
          [Op.in]: [
            'PROBLEM'
          ],
        },
      },
      include: [{
        model: OrderDetail,
        as: 'detail',
      }],
    });
    return response;
  }


  async delivered_total() {
    this.seller = await jwtSelector({ request: this.request });
    const response = await this.order.count({
      where: {
        '$detail.seller_id$': this.seller.id,
        status: {
          [Op.in]: [
            'DELIVERED'
          ],
        },
      },
      include: [{
        model: OrderDetail,
        as: 'detail',
      }],
    });
    return response;
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
