const moment = require('moment');
const { Sequelize } = require('sequelize');
const { OrderDetail, sequelize } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.op = Sequelize.Op;
    return this.process();
  }

  async process() {
    return new Promise((resolve, reject) => {
      try {
        const tempQuery = sequelize.dialect.queryGenerator.selectQuery('orders', {
          attributes: ['id'],
          where: { ...this.query() },
        }).slice(0, -1);

        const result = OrderDetail.findOne({
          attributes: [
            [sequelize.fn('sum', sequelize.col('cod_fee')), 'total_cod'],
            [sequelize.fn('count', sequelize.col('id')), 'count_cod'],
          ],
          where: {
            order_id: {
              [this.op.in]: sequelize.literal(`(${tempQuery})`),
            },
          },
        });

        if (result) {
          resolve(result);
        }

        resolve(0);
      } catch (error) {
        reject(error);
      }
    });
  }

  query() {
    const { query } = this.request;
    const condition = {
      is_cod: { [this.op.eq]: true },
    };

    if (query.type === 'total-cod') {
      condition.status = { [this.op.notIn]: ['CANCELED', 'RETURN_TO_SELLER'] };
    }

    if (query.type === 'delivered') {
      condition.status = { [this.op.in]: ['DELIVERED'] };
    }

    if (query.type === 'non-delivered') {
      condition.status = { [this.op.notIn]: ['DELIVERED', 'CANCELED', 'RETURN_TO_SELLER'] };
    }

    if (query.type === 'problem') {
      condition.status = { [this.op.in]: ['PROBLEM'] };
    }

    if (query.expedition) {
      condition.expedition = { [this.op.eq]: query.expedition };
    }

    if (query.start_date) {
      condition.created_at = {
        [this.op.between]: [
          moment(query.start_date).tz('Asia/Jakarta').startOf('day').format(),
          moment(query.end_date).endOf('day').format(),
        ],
      };
    }

    return condition;
  }
};
