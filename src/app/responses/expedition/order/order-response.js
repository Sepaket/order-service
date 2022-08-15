const moment = require('moment');
const shortid = require('shortid-36');
const jne = require('../../../../helpers/jne');
const ninja = require('../../../../helpers/ninja');
const jneParameter = require('./order-parameter/jne');
const sicepat = require('../../../../helpers/sicepat');
const ninjaParameter = require('./order-parameter/ninja');
const sicepatParameter = require('./order-parameter/sicepat');
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
  Seller,
  Location,
  Insurance,
  sequelize,
  OrderBatch,
  SellerDetail,
  SellerAddress,
  TransactionFee,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.jne = jne;
    this.ninja = ninja;
    this.seller = Seller;
    this.sicepat = sicepat;
    this.request = request;
    this.batch = OrderBatch;
    this.location = Location;
    this.fee = TransactionFee;
    this.insurance = Insurance;
    this.address = SellerAddress;
    this.sellerDetail = SellerDetail;

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
    const dbTransaction = await sequelize.transaction();

    try {
      const error = [];
      const result = [];
      const querySuccess = [];
      const queryrLogger = [];
      const { body } = this.request;

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
        include: [{ model: this.sellerDetail, as: 'sellerDetail' }],
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

      const response = await Promise.all(
        body.order_items.map(async (item) => {
          let parameter = null;
          const { credit } = seller.sellerDetail;
          const resi = await resiMapper({ expedition: body.type });
          const origin = sellerLocation?.location;
          const destination = destinationLocation?.find((location) => {
            const locationId = locationIds.find((id) => id === location.id);
            return location.id === locationId;
          });

          const shippingCharge = await shippingFee({
            origin,
            destination,
            weight: item.weight,
            expedition: body.type,
            serviceCode: body.service_code,
          });

          const codFee = (parseFloat(trxFee?.codFee) * parseFloat(shippingCharge)) / 100;
          const goodsAmount = !item.is_cod
            ? item.goods_amount
            : parseFloat(item.cod_value) - (parseFloat(shippingFee || 0) + codFee);

          const codCondition = (item.is_cod) ? (this.codValidator()) : true;
          const creditCondition = (parseFloat(credit) >= parseFloat(goodsAmount));
          const totalAmount = item?.is_cod
            ? parseFloat(item?.cod_value)
            : (parseFloat(item?.goods_amount) + parseFloat(shippingCharge));

          const payload = {
            creditCondition,
            sellerLocation,
            shippingCharge,
            codCondition,
            goodsAmount,
            destination,
            insurance,
            origin,
            seller,
            resi,
            ...item,
            ...body,
          };

          const messages = await orderValidator(payload);

          if (body.type === 'NINJA') parameter = await ninjaParameter({ payload });
          if (body.type === 'SICEPAT') parameter = await sicepatParameter({ payload });
          if (body.type === 'JNE') parameter = await jneParameter({ payload });
          if (messages?.length > 0) error.push({ order: item, errors: messages });

          if (messages?.length < 1) {
            querySuccess.push({ ...parameter, type: body.type });
            queryrLogger.push({
              ...payload,
              orderCode: `${shortid.generate()}${moment().format('mmss')}`,
              batchId: batch.id,
            });

            const resultResponse = await this.responseMapper({
              ...payload,
              totalAmount,
              insurance,
            });

            result.push(resultResponse);
          }

          return error?.shift();
        }),
      );

      if (querySuccess?.length > 0) {
        await orderSuccessLogger(querySuccess);
        await orderLogger(queryrLogger);
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
            service_code: body.service_code,
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

      return orderResponse;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  codValidator() {
    let result;
    const { body } = this.request;
    if (body.type === 'JNE') result = (body.service_code === 'REG19');
    if (body.type === 'SICEPAT') result = (body.service_code === 'SIUNT');
    if (body.type === 'NINJA') result = (body.service_code === 'Standard');

    return result;
  }

  responseMapper(payload) {
    return {
      resi: payload.resi,
      order: {
        order_code: payload.orderCode,
        service: payload.type,
        service_code: payload.service_code,
        weight: payload.weight,
        goods_content: payload.goods_content,
        goods_qty: payload.goods_qty,
        goods_notes: payload.notes,
        insurance_amount: payload.is_insurance ? payload.insurance?.insuranceValue || 0 : 0,
        is_cod: payload.is_cod,
        total_amount: {
          raw: payload.totalAmount,
          formatted: formatCurrency(payload.totalAmount, 'Rp.'),
        },
      },
      receiver: {
        name: payload.receiver_name,
        phone: payload.receiver_phone,
        address: payload.receiver_address,
        address_note: payload.receiver_address_note,
        location: payload.destination || null,
        postal_code: payload.postal_code,
        sub_district: payload.sub_district,
      },
      sender: {
        name: payload.receiver_name,
        phone: payload.receiver_phone,
        hide_address: this.sellerAddress?.hideInResi,
        address: this.sellerAddress?.address || '',
        address_note: '',
        location: payload.origin || null,
      },
    };
  }
};
