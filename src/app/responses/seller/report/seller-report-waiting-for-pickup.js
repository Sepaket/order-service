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
    return new Promise(async (resolve, reject) => {
      try {
        this.seller = await jwtSelector({ request: this.request });

        this.order.count({
          where: {
            '$detail.seller_id$': seller.id,
            status: 'WAITING_PICKUP',
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
};
