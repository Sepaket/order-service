const moment = require('moment');
const { Op } = require('sequelize');
const { Order, OrderDetail, ReturnStatus } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.orderDetail = OrderDetail;
    return this.process();
  }

  async process() {
    return new Promise(async (resolve, reject) => {
      try {
        const { params, body } = this.request;

        // console.log(body);
        this.orderDetail.findOne({
          include: [{
            model: Order,
            where: {
              resi: params.id,
            },
            as: 'order',
          }],
        }).then(async (response) => {
          // console.log('response : ', response.rows);

          await response.update(
            {
              returnStatus: body.status,
            },
          );

          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
};
