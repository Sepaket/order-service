const moment = require('moment');
const { Op,
  Sequelize
} = require('sequelize');
const { Order, OrderDetail,
  Location,
  OrderLog,
  OrderAddress,
  SellerAddress
} = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const httpErrors = require('http-errors');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.order = Order;
    this.op = Sequelize.Op;
    this.location = Location;
    this.orderLog = OrderLog;
    this.orderDetail = OrderDetail;
    this.orderAddress = OrderAddress;
    this.sellerAddress = SellerAddress;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {

    const seller = await jwtSelector({ request: this.request });

    return new Promise(async (resolve, reject) => {
      try {
        this.seller = await jwtSelector({ request: this.request });
        const response = await this.order.count({
          where: {
            '$detail.seller_id$': this.seller.id,
            is_cod: true,
            status: {
              [this.op.in]: [
                'PROCESSED', 'WAITING_PICKUP'
              ],
            },

          },
          include: [{
            model: OrderDetail,
            as: 'detail',
          }],
        });


        resolve(response)
      } catch (error) {
        reject(error);
      }
    });
  }


};
