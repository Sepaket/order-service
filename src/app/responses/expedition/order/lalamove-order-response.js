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
      let servCode = '';
      let resi = '';
      let totalAmount = 0;

      const batchConditon = (body?.batch_id && body?.batch_id !== '' && body?.batch_id !== null);
      const locationIds = body.order_items.map((item) => item.receiver_location_id);
      const sellerId = await jwtSelector({ request: this.request });
      const trxFee = await this.fee.findOne();

      let batch = await this.batch.findOne({
        where: { id: body?.batch_id || 0, sellerId: sellerId.id },
      });

      const insurance = await this.insurance.findOne({
        where: { expedition: body.type },
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

      const sellerLocation = await this.address.findOne({
        where: { id: body.seller_location_id, sellerId: sellerId.id },
        include: [{ model: this.location, as: 'location' }],
      });

      const destinationLocation = await this.location.findAll({
        where: { id: locationIds },
      });

      if (!batchConditon) {
        batch = await batchCreator({
          dbTransaction,
          sellerId: sellerId.id,
          expedition: body.type,
          batchCode: `B${body?.order_items?.length}${shortid.generate()}`,
          totalOrder: body?.order_items?.length || 0,
        });
      }

      const increment = 1;
      const response = await Promise.all(
        body.order_items.map(async (item, index) => {
          const codCondition = false;
          servCode = body.service_code;

          let parameter = null;
          const origin = sellerLocation?.location;
          const destination = destinationLocation?.find((location) => {
            const locationId = item.receiver_location_id;
            return location.id === locationId;
          });

          const shippingCharge = 0;

          if (body.type === 'LALAMOVE') {
            const tes_lalamove = '{"data":{"serviceType":"MOTORCYCLE","specialRequests":["TOLL_FEE_10"],"language":"en_HK","stops":[{"coordinates":{"lat":"22.33547351186244","lng":"114.17615807116502"},"address":"Innocentre, 72 Tat Chee Ave, Kowloon Tong"},{"coordinates":{"lat":"22.29553167157697","lng":"114.16885175766998"},"address":"Canton Rd, Tsim Sha Tsui"}],"isRouteOptimized":false,"item":{"quantity":"12","weight":"LESS_THAN_3_KG","categories":["FOOD_DELIVERY","OFFICE_ITEM"],"handlingInstructions":["KEEP_UPRIGHT"]}}}';
            // var resi = await resiMapper({ expedition: body.type, currentResi: sicepatResi, id: index,batchId: batch.id });
            resi = '999999999999';
          }

          const payload = {
            // codFeeAdmin: codValueCalculated,
            // discuontSelected: discountAmount,
            // shippingCalculated,
            // insuranceSelected,
            // creditCondition,
            sellerLocation,
            shippingCharge,
            codCondition,
            destination,
            origin,
            seller,
            ...item,
            ...body,
          };
          const orderCode = `${shortid.generate()}${moment().format('mmss')}`;
          const messages = await lalamove.validate(payload);
          if (body.type === 'LALAMOVE') parameter = await lalamoveParameter({ payload });

          console.log('messages :')
          console.log(messages)
          if (messages?.length > 0) error.push({ order: item, errors: messages });
          if (messages?.length < 1) {

            querySuccess.push({
              ...parameter,
              resi,
              type: body.type,
            });
            queryrLogger.push({
              ...payload,
              orderCode,
              batchId: batch.id,
            });
            const resultResponse = await this.responseMapper({
              ...payload,
              totalAmount,
              insurance,
              orderCode,
            });
            result.push(resultResponse);
          } else {
            console.log(messages)
          }

          return error?.shift();
          // return error;
        }),
      );
      if (querySuccess?.length > 0) {
        await orderSuccessLogger(querySuccess);

        await orderLogger({
          items: queryrLogger,
          sellerId: seller.id,
        });


      }

      const filtered = response?.filter((item) => item);
      const orderResponse = {
        info: {
          success: body.order_items.length - filtered.length,
          failed: filtered.length,
        },
        order: {
          pickup_info: {
            expedition: body.type,
            service_code: servCode,
            should_pickup_with: body.should_pickup_with,
            pickup_date: body.pickup_date,
            pickup_time: body.pickup_time,
            seller_location_id: body.seller_location_id,
          },
        },
        logs: {
          success_log: result,
          failed_log: filtered,
        },
      };

      if (filtered?.length > 0 && !batchConditon) {
        await this.batch.update(
          {
            totalOrderSent: 0,
            totalOrderProblem: filtered.length,
            totalOrderProcessed: body.order_items?.length - filtered?.length,
          },
          { where: { id: batch.id } },
        );
        await orderFailedLogger({
          ...orderResponse,
          batchId: batch.id,
        });
      }

      if (batchConditon) {
        const total = body.order_items?.length - filtered?.length;
        await this.batch.update(
          {
            totalOrderSent: batch.totalOrderSent,
            totalOrderProblem: filtered?.length,
            totalOrderProcessed: parseInt(batch.totalOrderProcessed, 10) + parseInt(total, 10),
          },
          { where: { id: batch.id } },
        );
      }
      console.log('lala order response');
      console.log(orderResponse);
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
      resi: payload?.resi,
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
