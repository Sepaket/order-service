const { Sequelize } = require('sequelize');
const { OrderDetail, sequelize } = require('../../../models');

module.exports = class {
  constructor() {
    return this.process();
  }

  // eslint-disable-next-line class-methods-use-this
  async process() {
    return new Promise((resolve, reject) => {
      try {
        const tempQuery = sequelize.dialect.queryGenerator.selectQuery('orders', {
          attributes: ['id'],
          where: {
            status: {
              [Sequelize.Op.in]: ['DELIVERED'],
            },
            is_cod: {
              [Sequelize.Op.eq]: true,
            },
          },
        }).slice(0, -1);

        const totalBalance = OrderDetail.sum('cod_fee', {
          where: {
            order_id: {
              [Sequelize.Op.in]: sequelize.literal(`(${tempQuery})`),
            },
          },
        });

        if (totalBalance) {
          resolve(totalBalance);
        }

        resolve(0);
      } catch (error) {
        reject(error);
      }
    });
  }
};
