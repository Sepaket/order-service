const moment = require('moment');
const shortid = require('shortid-36');
const { Sequelize } = require('sequelize');
const jne = require('../../../../helpers/jne');
const tax = require('../../../../constant/tax');
const ninja = require('../../../../helpers/ninja');
const jneParameter = require('./order-parameter/jne');
const sicepat = require('../../../../helpers/sicepat');
const ninjaParameter = require('./order-parameter/ninja');
const sicepatParameter = require('./order-parameter/sicepat');
const jwtSelector = require('../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { formatCurrency } = require('../../../../helpers/currency-converter');
const {
  batchCreator,
  resiMapper,
  shippingFee,
  orderLogger,
} = require('../../../../helpers/order-helper');
const {
  Seller,
  Order,
  OrderTax,
  OrderLog,
  Location,
  Discount,
  Insurance,
  sequelize,
  OrderBatch,
  OrderDetail,
  OrderFailed,
  OrderAddress,
  SellerDetail,
  SellerAddress,
  OrderDiscount,
  TransactionFee,
  OrderBackground,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.tax = tax;
    this.jne = jne;
    this.ninja = ninja;
    this.order = Order;
    this.seller = Seller;
    this.sicepat = sicepat;
    this.request = request;
    this.op = Sequelize.Op;
    this.batch = OrderBatch;
    this.location = Location;
    this.orderTax = OrderTax;
    this.orderLog = OrderLog;
    this.discount = Discount;
    this.fee = TransactionFee;
    this.insurance = Insurance;
    this.address = SellerAddress;
    this.orderDetail = OrderDetail;
    this.orderFailed = OrderFailed;
    this.sellerDetail = SellerDetail;
    this.orderAddress = OrderAddress;
    this.orderDiscount = OrderDiscount;
    this.converter = snakeCaseConverter;
    this.orderBackground = OrderBackground;

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
      const { body } = this.request;

      const batchConditon = (body?.batch_id && body?.batch_id !== '' && body?.batch_id !== null);
      const sellerId = await jwtSelector({ request: this.request });
      const trxFee = await this.fee.findOne();

      let batch = await this.batch.findOne({
        where: { id: body?.batch_id, sellerId: sellerId.id },
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
          const messages = [];
          let parameter = null;
          const { credit } = seller.sellerDetail;
          const resi = await resiMapper({ expedition: body.type });
          const origin = sellerLocation?.location;
          const destination = await this.location.findOne({
            where: { id: item.receiver_location_id },
          });

          const shippingCharge = await shippingFee({
            origin,
            destination,
            weight: item.weight,
            expedition: body.type,
            serviceCode: body.service_code,
          });

          const codFee = (parseFloat(trxFee?.codFee) * parseFloat(shippingCharge)) / 100;
          const goodsAmount = !body.is_cod
            ? item.goods_amount
            : parseFloat(body.cod_value) - (parseFloat(shippingFee || 0) + codFee);

          const totalAmount = item?.is_cod
            ? parseFloat(item?.cod_value)
            : (parseFloat(item?.goods_amount) + parseFloat(shippingCharge));

          const payload = {
            sellerLocation,
            shippingCharge,
            goodsAmount,
            destination,
            insurance,
            origin,
            seller,
            resi,
            ...item,
            ...body,
          };

          const creditCondition = (parseFloat(credit) >= parseFloat(goodsAmount));
          const codCondition = (item.is_cod) ? (this.codValidator()) : true;
          if (body.type === 'NINJA') parameter = await ninjaParameter({ payload });
          if (body.type === 'SICEPAT') parameter = await sicepatParameter({ payload });
          if (body.type === 'JNE') parameter = await jneParameter({ payload });

          if (!shippingFee) messages.push({ message: 'Destinasi yang dituju tidak ditemukan' });
          if (!codCondition) messages.push({ message: 'Tipe penjemputan ini tidak tersedia saat anda memilih COD' });
          if (!creditCondition) messages.push({ message: 'Saldo anda tidak cukup untuk melakukan pengiriman non COD' });
          if (!shippingFee || !codCondition || !creditCondition) {
            error.push({ order: item, errors: messages });
          }

          if (shippingFee && codCondition && creditCondition) {
            await this.insertSuccessOrder(parameter);
            const order = await orderLogger({
              ...payload,
              batchId: batch.id,
            });

            const resultResponse = await this.responseMapper({
              ...payload,
              totalAmount,
              insurance,
              order,
            });

            result.push(resultResponse);
          }

          return error?.shift();
        }),
      );

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
        await this.insertOrderFailed({
          ...orderResponse,
          batchId: batch.id,
        });
      }

      if (batchConditon) {
        await this.batch.update(
          {
            totalOrderSent: batch.totalOrderSent,
            totalOrderProblem: filtered?.length,
            totalOrderProcessed: batch.totalOrderProcessed,
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
    const { body } = this.request;
    return (body.service_code === 'SIUNT');
  }

  async insertSuccessOrder(parameter) {
    const { body } = this.request;
    const dbTransaction = await sequelize.transaction();

    try {
      await this.orderBackground.create(
        {
          id: `${shortid.generate()}${moment().format('HHmmss')}`,
          expedition: body.type,
          parameter: JSON.stringify(parameter),
        },
        { transaction: dbTransaction },
      );
      await dbTransaction.commit();
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(error?.message);
    }
  }

  async insertOrderFailed(parameter) {
    const dbTransaction = await sequelize.transaction();

    const payload = { ...parameter };
    delete payload.batchId;

    try {
      await this.orderFailed.create(
        {
          id: `${shortid.generate()}${moment().format('HHmmss')}`,
          batchId: parameter.batchId,
          payload: JSON.stringify(payload),
        },
        { transaction: dbTransaction },
      );
      await dbTransaction.commit();
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(error?.message);
    }
  }

  responseMapper(payload) {
    return {
      resi: payload.resi,
      order_id: payload.order.id,
      order: {
        order_code: payload.order.orderCode,
        order_id: payload.order.id,
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
