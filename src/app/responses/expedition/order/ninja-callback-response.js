const httpErrors = require('http-errors');
const { Order, sequelize, OrderLog } = require('../../../models');
const ninjaStatus = require('../../../../constant/ninja-status');
const orderStatus = require('../../../../constant/order-status');

module.exports = class {
  constructor({ request }) {
    this.order = Order;
    this.log = OrderLog;
    this.request = request;
    this.status = ninjaStatus;
    return this.process();
  }

  getLastStatus(trackingStatus) {
    let currentStatus = '';
    if (this.status.PROCESSED.indexOf(trackingStatus) !== -1) {
      currentStatus = orderStatus.PROCESSED.text;
    }

    if (this.status.DELIVERED.indexOf(trackingStatus) !== -1) {
      currentStatus = orderStatus.DELIVERED.text;
    }

    if (this.status.CANCELED.indexOf(trackingStatus) !== -1) {
      currentStatus = orderStatus.CANCELED.text;
    }

    if (this.status.RETURN_TO_SELLER.indexOf(trackingStatus) !== -1) {
      currentStatus = orderStatus.RETURN_TO_SELLER.text;
    }

    if (this.status.PROBLEM.indexOf(trackingStatus) !== -1) {
      currentStatus = orderStatus.PROBLEM.text;
    }

    return currentStatus;
  }

  async process() {
    const dbTransaction = await sequelize.transaction();

    try {
      const { body } = this.request;
      const converted = JSON.parse(body);
      const resi = converted?.tracking_ref_no || converted?.tracking_id?.split(`${process.env.NINJA_ORDER_PREFIX}C`)?.pop();
      const order = await this.order.findOne({ where: { resi } });

      if (!order) {
        throw new Error('Invalid Data (tracking_ref_no or tracking_id)');
      }

      const currentStatus = this.getLastStatus(converted.status.toLowerCase());

      await this.log.create({
        orderId: order.id,
        previousStatus: order?.status,
        currentStatus,
        note: converted?.comments || converted.status,
      });

      await this.order.update(
        {
          status: currentStatus,
          pod_status: converted.status,
        },
        { where: { id: order.id } },
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
