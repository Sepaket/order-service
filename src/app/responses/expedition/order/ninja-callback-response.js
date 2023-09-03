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
  NinjaTracking,
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
    this.ninjaTracking = NinjaTracking;
    this.orderHistory = OrderHistory;
    return this.process();
  }

  addTrackingData(converted) {
    this.ninjaTracking.create({
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
  }

  async updateOrderHistory(resi, currentStatus) {
    console.log('NINJA UPDATE ORDER HISTORY : ');
    const order = await Order.findOne({
      where: { resi },
      include: [
        // eslint-disable-next-line no-use-before-define
        { model: OrderDetail, as: 'detail' },
        { model: OrderHistory, as: 'history' },
      ],
    });
    const orderDetail = await OrderDetail.findOne({ where: { orderId: order.id } });
    let deltaCredit = 0;
    let referralCredit = 0;

    if (currentStatus === 'WAITING_PICKUP') {


    } else if (currentStatus === 'PROCESSED') {
      console.log('this is processed');
    } else if ((currentStatus === 'DELIVERED') && (order?.isCod)) {
      console.log('this is DELIVERED');
      deltaCredit = parseFloat(order.detail.shippingCalculated);

      await orderHelper.addOrderHistory(order.id, order.isCod, deltaCredit, referralCredit, false, false, currentStatus);
    } else if ((currentStatus === 'DELIVERED') && (!order?.isCod)) {
      // NON COD berarti tidak ada proses penambahan saldo
      // COD ada addorderhistory
      console.log('this is DELIVERED NON COD');
      // await this.addOrderHistory(resi, currentStatus, false, false);
      await orderHelper.addOrderHistory(order.id, order.isCod, deltaCredit, referralCredit, true, false, currentStatus);
    } else if (currentStatus === 'CANCELED') {
      console.log('this is CANCELED');
      // kalau NONCOD berarti ongkir dikembalikan
      // kalau COD tidak ada
    } else if ((currentStatus === 'RETURN_TO_SELLER') && (order?.isCod)) {
      console.log('this is RETURN_TO_SELLER');
      // COD dan NONCOD ongkir tidak dikembalikan
      deltaCredit = -1 * deltaCredit;
      deltaCredit += parseFloat(order.detail.codFeeAdmin);
      referralCredit = -1 * referralCredit;
      console.log('this is RETURN_TO_SELLER 2');
      await orderHelper.addOrderHistory(order.id, order.isCod, deltaCredit, referralCredit, false, false, currentStatus);
    } else if ((currentStatus === 'RETURN_TO_SELLER') && (!order.isCod)) {
      console.log('this is RETURN_TO_SELLER NON COD');
      // COD dan NONCOD ongkir tidak dikembalikan
      referralCredit = -1 * referralCredit;
      await orderHelper.addOrderHistory(order.id, order.isCod, deltaCredit, referralCredit, true, false, currentStatus);
    } else if (currentStatus === 'PROBLEM') {

    } else {
      console.log('ninja status : PROBLEM');
    }
  }

  updateOH(resi, currentStatus, isExecute, onHold) {
    console.log('update order history');
  }

  updateSellerDetail() {
    // console.log('update tracking history');
  }

  async addOrderHistorytidakdipakai(resi, currentStatus, isExecute, onHold) {
    await Order.findOne({
      where: { resi },
      include: [
        { model: this.orderDetail, as: 'detail' },
        { model: this.orderHistory, as: 'history' },
      ],
    }).then(async (result) => {
      let deltaCredit = 0;
      let referralCredit = 0;
      let addOrderFlag = 0;
      if (result === null) {
        console.log('Order not found');
      } else {
        deltaCredit = parseFloat(result.detail.shippingCalculated);
        if (result?.detail?.referralRateType === 'PERCENTAGE') {
          referralCredit = result.detail.referralRate * parseFloat(result.detail.shippingCalculated) / 100;
        }

        if ((currentStatus === 'DELIVERED') && (!result?.isCod)) {
          deltaCredit = 0;
          addOrderFlag = 1;
        } else if ((currentStatus === 'RETURN_TO_SELLER') && (result?.isCod)) {
          deltaCredit = -1 * deltaCredit;
          deltaCredit += parseFloat(result.detail.codFeeAdmin);
          referralCredit = -1 * referralCredit;
          addOrderFlag = 1;
        } else if ((currentStatus === 'DELIVERED') && (result?.isCod)) {
          deltaCredit = parseFloat(result.detail.sellerReceivedAmount);
          addOrderFlag = 1;
        }

        if (result.history === null) {
          if (addOrderFlag) {
            await OrderHistory.create({
              orderId: result?.id,
              deltaCredit,
              isExecute,
              onHold,
              isCod: result?.isCod,
              provider: result?.expedition,
              note: currentStatus,
              referralId: result?.detail?.referredSellerId,
              referralCredit,
              referralBonusExecuted: false,
            });
          }
        } else {
          console.log('update history instead');
          await result.history.update(
            {
              note: currentStatus,
              deltaCredit,
              referralCredit,
            },
          );
        }
      }
    });
  }

  getLastStatus(trackingStatus) {
    let currentStatus = '';
    if (this.status.WAITING_PICKUP.indexOf(trackingStatus) !== -1) {
      currentStatus = orderStatus.WAITING_PICKUP.text;
    }

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
      const { body, headers } = this.request;
      const converted = !headers['content-type'].includes('application/json') ? JSON.parse(body) : body;

      const currentStatus = this.getLastStatus(converted.status.toLowerCase());
      // add referral and order_histories here
      //

      await this.addTrackingData(converted);
      await this.updateOrderHistory(converted.tracking_ref_no, currentStatus);

      const resi = converted?.tracking_ref_no || converted?.tracking_id?.split(`${process.env.NINJA_ORDER_PREFIX}C`)?.pop();
      const order = await this.order.findOne({
        where: { resi },
        include: [{ model: this.orderDetail, as: 'detail' }],
      });

      if (!order) {
        throw new Error('Invalid Data (tracking_ref_no or tracking_id)');
      }
      console.log('ninja callback. status = ', currentStatus);

      if (currentStatus === 'DELIVERED') {
        if (currentStatus === order.status) {
          throw new Error('no change in status');
        }
      } else if (currentStatus === 'RETURN_TO_SELLER') {
        if (currentStatus === order.status) {
          throw new Error('no change in status');
        }
      }

      // const currentSaldo = await this.seller.findOne({
      //   where: { sellerId: order.detail.sellerId },
      // });
      //
      // const calculatedCredit = (
      //   parseFloat(currentSaldo.credit) + parseFloat(order.detail.sellerReceivedAmount)
      // );
      //
      // if (converted.status.toLowerCase() === 'completed' && order.isCod) {
      //   await this.seller.update(
      //     { credit: parseFloat(calculatedCredit) },
      //     { where: { sellerId: order.detail.sellerId } },
      //     { transaction: dbTransaction },
      //   );
      // }

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
