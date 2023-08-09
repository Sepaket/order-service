const httpErrors = require('http-errors');
const ninjaStatus = require('../../../../constant/ninja-status');
const orderStatus = require('../../../../constant/order-status');
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

  async updateOrderHistory(resi,currentStatus) {
    console.log('order : ');
    // console.log(converted.tracking_ref_no);
    if (currentStatus === 'WAITING_PICKUP') {
      console.log(' WAITING PICKUP ');
      await this.addOrderHistory(resi, currentStatus, false, false);
    } else if (currentStatus === 'PROCESSED') {
      console.log('this is processed');
      await this.addOrderHistory(resi, currentStatus, false, false);
      //UPDATE order,order_history dan order_detail bila perslu (perubahan berat)
      // await this.updateOH(resi, currentStatus, false, false);
    } else if (currentStatus === 'DELIVERED') {
      //NON COD berarti tidak ada proses penambahan saldo
      // COD ada addorderhistory
      console.log('this is DELIVERED');
      await this.addOrderHistory(resi, currentStatus, false, false);
    } else if (currentStatus === 'CANCELED') {
      console.log('this is CANCELED');
      //kalau NONCOD berarti ongkir dikembalikan
      //kalau COD tidak ada
    } else if (currentStatus === 'RETURN_TO_SELLER') {
      console.log('this is RETURN_TO_SELLER');
      //COD dan NONCOD ongkir tidak dikembalikan
      await this.addOrderHistory(resi, currentStatus, false, false);
    } else if (currentStatus === 'PROBLEM') {

    } else {
      console.log('PROBLEM');
    }
  }

  updateOH(resi, currentStatus, isExecute, onHold) {
    console.log('update order history');

  }

  updateSellerDetail() {
    // console.log('update tracking history');
  }

  async addOrderHistory(resi, currentStatus, isExecute, onHold) {
    await Order.findOne({
      where: { resi },
      include: [
        { model: this.orderDetail, as: 'detail',
        },
        { model: this.orderHistory, as: 'history',
        },
      ],
    }).then(async (result) => {
      let deltaCredit = 0;
      let referralCredit = 0;
      if (result === null) {
        console.log('Order not found');

      } else {
        deltaCredit = parseFloat(result.detail.shippingCalculated);
        if (result?.detail?.referralRateType === 'PERCENTAGE') {
          referralCredit = result.detail.referralRate * parseFloat(result.detail.shippingCalculated) / 100;
        }

        if ((currentStatus === 'DELIVERED') && (!result?.isCod)) {
          deltaCredit = 0;
        } else if ((currentStatus === 'RETURN_TO_SELLER') && (result?.isCod)) {

          // eslint-disable-next-line operator-assignment
          deltaCredit = -1 * deltaCredit;
          deltaCredit = deltaCredit + parseFloat(result.detail.codFeeAdmin);

          // eslint-disable-next-line operator-assignment
          referralCredit = -1 * referralCredit;
        }

        if (result.history === null) {

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
        } else {
          console.log('update history instead');
          await result.history.update(
            { note: currentStatus,
              deltaCredit,
              referralCredit,
            },
          );
        }
      }

    })

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
