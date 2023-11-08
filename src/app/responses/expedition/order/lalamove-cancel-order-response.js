const moment = require('moment');
const shortid = require('shortid-36');
const { Sequelize } = require('sequelize');
const { stringify } = require('querystring');
const lalamove = require('../../../../helpers/lalamove');
const tax = require('../../../../constant/tax');
const lalamoveParameter = require('./order-parameter/lalamove');
const jwtSelector = require('../../../../helpers/jwt-selector');
const orderValidator = require('../../../../helpers/order-validator');
const lalaOrderValidator = require('../../../../helpers/lala-order-validator');
const { formatCurrency } = require('../../../../helpers/currency-converter');
const {
  batchCreator,
  resiMapper,
  shippingFee,
  orderLogger,
  orderSuccessLogger,
  orderFailedLogger,
} = require('../../../../helpers/order-helper');
const {
  Order,
  Seller,
  Location,
  Discount,
  Insurance,
  sequelize,
  OrderBatch,
  SellerDetail,
  SellerAddress,
  TransactionFee,
  ResiTracker,
  LalamoveTracking,
  TrackingHistory,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.lalamove = lalamove;
    this.tax = tax;
    this.order = Order;
    this.seller = Seller;
    this.op = Sequelize.Op;
    this.request = request;

    this.sellerDetail = SellerDetail;
    this.resiTracker = ResiTracker;
    this.lalamoveTracking = LalamoveTracking;

    return this.cancelOrder();
  }

  async cancelOrder() {

    const dbTransaction = await sequelize.transaction();
    console.log('inside lala cancel order');
    try {
      const error = [];
      const result = [];
      const querySuccess = [];
      const queryrLogger = [];
      const { body } = this.request;

      const orderId = body.order_id;

      // if (messages.length > 0) {
      //   throw new Error(messages[0].message || 'Something Wrong');
      // }
      const orderResponse = await this.lalamove.sdkCancelOrder(orderId, body);
      // console.log('order response form cancellation : ', orderResponse);
      return;
    } catch (error) {
      // console.log('error here : ', error)
      throw new Error(error?.message || 'Something Wrong');
    }
  }

};
