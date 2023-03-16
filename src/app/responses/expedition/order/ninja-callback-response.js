const httpErrors = require('http-errors');
const ninjaStatus = require('../../../../constant/ninja-status');
const orderStatus = require('../../../../constant/order-status');
const {
  Order,
  sequelize,
  OrderLog,
  OrderDetail,
  SellerDetail,
  NinjaTracking,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.order = Order;
    this.log = OrderLog;
    this.request = request;
    this.status = ninjaStatus;
    this.seller = SellerDetail;
    this.orderDetail = OrderDetail;
    this.ninjaTracking = NinjaTracking;
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
    console.log('process ninja callback');

    try {
      const { body, headers } = this.request;
      const converted = !headers['content-type'].includes('application/json') ? JSON.parse(body) : body;

      await this.ninjaTracking.create({
        shipperId: converted.shipper_id,
        trackingRefNo: converted.tracking_ref_no,
        shipperRefNo: converted.shipper_ref_no,
        shipperOrderRefNo: converted.shipper_order_ref_no,
        status: converted.status,
        previousStatus: converted.previous_status,
        trackingId: converted.tracking_id,
        timestamp: converted.timestamp,
        comments: converted.comments,

        raw: JSON.stringify(converted),
      });
      const currentStatus = this.getLastStatus(converted.status.toLowerCase());
      console.log('converted ninja status : ' + currentStatus);


      const resi = converted?.tracking_ref_no || converted?.tracking_id?.split(`${process.env.NINJA_ORDER_PREFIX}C`)?.pop();
      const order = await this.order.findOne({
        where: { resi },
        include: [{ model: this.orderDetail, as: 'detail' }],
      });

      if (!order) {
        throw new Error('Invalid Data (tracking_ref_no or tracking_id)');
      }


      const currentSaldo = await this.seller.findOne({
        where: { sellerId: order.detail.sellerId },
      });

      const calculatedCredit = (
        parseFloat(currentSaldo.credit) + parseFloat(order.detail.sellerReceivedAmount)
      );

      if (converted.status.toLowerCase() === 'completed' && order.isCod) {
        await this.seller.update(
          { credit: parseFloat(calculatedCredit) },
          { where: { sellerId: order.detail.sellerId } },
          { transaction: dbTransaction },
        );
      }

      await this.log.create({
        orderId: order.id,
        previousStatus: order?.status,
        currentStatus,
        podStatus: converted?.status || '',
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
