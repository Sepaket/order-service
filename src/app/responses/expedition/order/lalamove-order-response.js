const moment = require('moment');
const shortid = require('shortid-36');
const { Sequelize } = require('sequelize');
const { stringify } = require('querystring');
const lalamove = require('../../../../helpers/lalamove');
const tax = require('../../../../constant/tax');
const lalamoveParameter = require('./order-parameter/lalamove');
const jwtSelector = require('../../../../helpers/jwt-selector');
const orderValidator = require('../../../../helpers/order-validator');
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
    this.batch = OrderBatch;
    this.location = Location;
    this.discount = Discount;
    this.fee = TransactionFee;
    this.insurance = Insurance;
    this.address = SellerAddress;
    this.sellerDetail = SellerDetail;
    this.resiTracker = ResiTracker;
    this.lalamoveTracking = LalamoveTracking;

    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.createOrder();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  async createOrder() {
    console.log('lalamove-order-response.js - createOrder');
    const dbTransaction = await sequelize.transaction();




    try {
      const error = [];
      const result = [];
      const querySuccess = [];
      const queryrLogger = [];
      const { body } = this.request;

      const quotationId = body.quotation_id;
      const quotationDetail = await this.lalamove.retrieveQuotation(quotationId);

      const orderResponse = await this.lalamove.sdkOrder(quotationDetail, body);
      // console.log('order detail : ', orderResponse.shareLink);
      const sellerId = await jwtSelector({ request: this.request });
      await LalamoveTracking.create({
        rawResponse: JSON.stringify(orderResponse),
        rawPayload: JSON.stringify(quotationDetail),
        sellerId: sellerId.id,
        trackingUrl: orderResponse.shareLink,
      });


      let servCode = '';
      let resi = '';
      let totalAmount = 0;
      let shippingCalculated = 0;




      let batch = await this.batch.findOne({
        where: { id: body?.batch_id || 0, sellerId: sellerId.id },
      });

      const insurance = await this.insurance.findOne({
        where: { expedition: 'LALAMOVE' },
      });

      const seller = await this.seller.findOne({
        where: { id: sellerId.id },
        include: [
          {
            model: this.sellerDetail,
            as: 'sellerDetail',
            include: [
              {
                model: this.seller,
                as: 'referred',
                required: false,
                include: [
                  {
                    model: this.sellerDetail,
                    as: 'referredDetail',
                    required: false,
                  }],
              }],
          }],
      });


      // console.log(order);
      return orderResponse;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  responseMapper(payload) {
    const truncatedAddress = (payload?.receiver_address).substring(0, 200) || null;
    const truncatedAddressNote = (payload?.receiver_address_note).substring(0, 100) || null;
    const truncatedGoodsContent = (payload?.goods_content).substring(0, 50) || null;
    const truncatedGoodsNotes = (payload?.notes).substring(0, 100) || null;
    const servCode = payload?.service_code || null;

    return {
      resi: '999999',
      order: {
        order_code: payload?.orderCode,
        service: payload?.type,
        service_code: servCode,
        weight: payload?.weight,
        goods_content: truncatedGoodsContent,
        goods_qty: payload?.goods_qty,
        goods_notes: truncatedGoodsNotes,
        insurance_amount: payload?.is_insurance ? payload?.insuranceSelected || 0 : 0,
        is_cod: payload?.is_cod,
        total_amount: {
          raw: payload?.totalAmount,
          formatted: formatCurrency(payload?.totalAmount, 'Rp.'),
        },
      },
      receiver: {
        name: payload?.receiver_name,
        phone: payload?.receiver_phone,
        address: truncatedAddress,
        address_note: truncatedAddressNote,
        location: payload?.destination || null,
        postal_code: payload?.postal_code,
        sub_district: payload?.sub_district,
      },
      sender: {
        name: payload?.sellerLocation?.name || '',
        pic_name: payload?.sellerLocation?.picName || '',
        phone: payload?.sellerLocation?.picPhoneNumber || '',
        address: payload?.sellerLocation?.address || '',
        address_note: '',
        location: payload?.origin || null,
      },
    };
  }
};
