const httpErrors = require('http-errors');
const { add } = require('nodemon/lib/rules');
const ninjaStatus = require('../../../../constant/ninja-status');
const orderStatus = require('../../../../constant/order-status');
// eslint-disable-next-line import/extensions

const {
  Order,
  sequelize,
  OrderLog,
  OrderDetail,
  SellerDetail,
  OrderHistory,
  LalamoveTracking,
  TrackingHistory,
} = require('../../../models');
const orderHelper = require('../../../../helpers/order-helper');

module.exports = class {
  constructor({ request }) {
    this.order = Order;
    this.log = OrderLog;
    this.request = request;
    this.status = ninjaStatus;
    this.seller = SellerDetail;
    this.orderDetail = OrderDetail;
    this.orderHistory = OrderHistory;
    this.LalamoveTracking = LalamoveTracking;
    return this.process();
  }

  addTrackingData(converted) {
    this.LalamoveTracking.create({
      rawResponse: JSON.stringify(converted),
    });
  }



  async process() {
    const dbTransaction = await sequelize.transaction();

    try {
      const { body, headers } = this.request;
      const converted = !headers['content-type'].includes('application/json') ? JSON.parse(body) : body;

      // const currentStatus = this.getLastStatus(converted.status.toLowerCase());

      await this.addTrackingData(converted);

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
