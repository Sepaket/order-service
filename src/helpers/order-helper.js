require('dotenv').config();
const moment = require('moment');
const shortid = require('shortid-36');
const { Sequelize } = require('sequelize');
const randomNumber = require('random-number');
const profitHandler = require('./profit-seller');
const orderStatus = require('../constant/order-status');
const tax = require('../constant/tax');
const sicepat = require('./sicepat');
const ninja = require('./ninja');
const jne = require('./jne');
const {
  Order,
  OrderTax,
  OrderLog,
  Discount,
  sequelize,
  OrderBatch,
  OrderDetail,
  OrderAddress,
  OrderFailed,
  SellerDetail,
  OrderDiscount,
  TransactionFee,
  OrderBackground,
} = require('../app/models');

const batchCreator = (params) => new Promise(async (resolve, reject) => {
  const {
    dbTransaction,
    expedition,
    sellerId,
    totalOrder,
    batchCode,
  } = params;

  try {
    const batch = await OrderBatch.create(
      {
        expedition,
        sellerId,
        batchCode,
        totalOrder,
        totalOrderProcessed: 0,
        totalOrderSent: 0,
        totalOrderProblem: 0,
      },
      { transaction: dbTransaction },
    );
    await dbTransaction.commit();
    resolve(batch);
  } catch (error) {
    await dbTransaction.rollback();
    reject(error);
  }
});

const resiMapper = (params) => new Promise(async (resolve, reject) => {
  try {
    let resi = '';
    const { expedition } = params;
    const sicepatResi = `${process.env.SICEPAT_CUSTOMER_ID}${randomNumber({ integer: true, max: 99999, min: 10000 })}`;
    const ninjaResi = `${process.env.NINJA_ORDER_PREFIX}${shortid.generate()}`;
    const jneResi = `${process.env.JNE_ORDER_PREFIX}${shortid.generate()}`;
    if (expedition === 'SICEPAT') resi = sicepatResi;
    if (expedition === 'NINJA') resi = ninjaResi;
    if (expedition === 'JNE') resi = jneResi;
    resolve(resi);
  } catch (error) {
    reject(error);
  }
});

const shippingFee = (payload) => new Promise(async (resolve, reject) => {
  try {
    let price = 0;
    const {
      origin,
      weight,
      expedition,
      destination,
      serviceCode,
    } = payload;

    if (expedition === 'JNE') {
      const prices = await jne.checkPrice({
        origin: origin?.jneOriginCode,
        destination: destination?.jneDestinationCode,
        weight,
      });

      const service = await prices?.find((item) => item.service_code === serviceCode);
      price = service?.price || 0;
    }

    if (expedition === 'NINJA') {
      const prices = await ninja.checkPrice({
        origin: origin?.ninjaOriginCode,
        destination: destination?.ninjaDestinationCode,
        service: serviceCode,
        weight,
      });

      price = prices || 0;
    }

    if (expedition === 'SICEPAT') {
      const prices = await sicepat.checkPrice({
        origin: origin?.sicepatOriginCode,
        destination: destination?.sicepatDestinationCode,
        weight,
      });

      const service = await prices?.find((item) => item.service === serviceCode);
      price = service?.tariff || 0;
    }

    resolve(parseFloat(price));
  } catch (error) {
    reject(error);
  }
});

const orderQuery = async (payload) => ({
  batchId: payload.batchId,
  orderCode: shortid.generate(),
  resi: payload.resi,
  expedition: payload.type,
  serviceCode: payload.service_code,
  isCod: payload.is_cod || false,
  orderDate: payload.pickup_date,
  orderTime: payload.pickup_time,
  status: orderStatus.WAITING_PICKUP.text,
});

const orderQueryDetail = async (payload) => {
  const calculateFee = await profitHandler(payload);
  const trxFee = await TransactionFee.findOne();

  return {
    batchId: payload.batchId,
    sellerId: payload.seller.id,
    sellerAddressId: payload.sellerLocation?.id,
    weight: payload.weight,
    totalItem: payload.goods_qty,
    notes: payload.notes,
    goodsContent: payload.goods_content,
    goodsPrice: !payload.is_cod ? payload.goods_amount : 0.00,
    codFee: payload.is_cod ? payload.cod_value : 0.00,
    shippingCharge: payload.shippingCharge,
    useInsurance: payload.is_insurance,
    sellerReceivedAmount: calculateFee,
    insuranceAmount: payload?.insuranceSelected?.insuranceValue || 0,
    isTrouble: false,
    codFeeAdmin: trxFee?.codFee || 0,
    codFeeAdminType: trxFee?.codFeeType || '',
  };
};

const orderQueryAddress = async (payload) => ({
  senderName: payload.sender_name,
  senderPhone: payload.sender_phone,
  receiverName: payload.receiver_name,
  receiverPhone: payload.receiver_phone,
  receiverAddress: payload.receiver_address,
  receiverAddressNote: payload.receiver_address_note,
  receiverLocationId: payload.receiver_location_id,
});

const orderQueryTax = async (payload) => {
  const { vat, vatType } = tax;

  return {
    taxAmount: (parseFloat(payload?.shippingCharge) * parseFloat(vat)) / 100,
    taxType: 'AMOUNT',
    vatTax: vat,
    vatType,
  };
};

const orderQueryDiscount = async (payload) => {
  const sellerDiscount = payload.seller.sellerDetail.discount;
  const sellerDiscountType = payload.seller.sellerDetail.discountType;
  const globalDiscount = await Discount.findOne({
    where: {
      [Sequelize.Op.or]: {
        minimumOrder: {
          [Sequelize.Op.gte]: 0,
        },
        maximumOrder: {
          [Sequelize.Op.lte]: payload.order_items.length,
        },
      },
    },
  });

  return {
    discountSeller: sellerDiscount || 0,
    discountSellerType: sellerDiscountType || '',
    discountProvider: 0,
    discountProviderType: 'PERCENTAGE',
    discountGlobal: globalDiscount?.value || 0,
    discountGlobalType: globalDiscount?.type || '',
  };
};

const sellerDetailQuery = async (payload) => {
  const result = (
    parseFloat(payload.seller.sellerDetail.credit) - parseFloat(payload.goodsAmount)
  );

  return {
    credit: result,
  };
};

const orderLogger = (params) => new Promise(async (resolve, reject) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const queryOrder = await orderQuery(params);
    const orderTaxQuery = await orderQueryTax(params);
    const orderDetailQuery = await orderQueryDetail(params);
    const orderAddressQuery = await orderQueryAddress(params);
    const querySellerDetail = await sellerDetailQuery(params);
    const orderDiscountQuery = await orderQueryDiscount(params);

    const order = await Order.create(
      { ...queryOrder },
      { transaction: dbTransaction },
    );

    await OrderDetail.create(
      { ...orderDetailQuery, orderId: order.id },
      { transaction: dbTransaction },
    );

    await OrderAddress.create(
      { ...orderAddressQuery, orderId: order.id },
      { transaction: dbTransaction },
    );

    await OrderLog.create(
      { previousStatus: orderStatus.WAITING_PICKUP.text, orderId: order.id },
      { transaction: dbTransaction },
    );

    await OrderTax.create(
      { ...orderTaxQuery, orderId: order.id },
      { transaction: dbTransaction },
    );

    await OrderDiscount.create(
      { ...orderDiscountQuery, orderId: order.id },
      { transaction: dbTransaction },
    );

    if (!params.is_cod) {
      await SellerDetail.update(
        { ...querySellerDetail },
        { where: { sellerId: params.seller.id } },
        { transaction: dbTransaction },
      );
    }

    await dbTransaction.commit();
    resolve(order);
  } catch (error) {
    await dbTransaction.rollback();
    reject(error);
  }
});

const orderSuccessLogger = (parameter) => new Promise(async (resolve, reject) => {
  const dbTransaction = await sequelize.transaction();
  const payload = { ...parameter };
  delete payload.type;

  try {
    await OrderBackground.create(
      {
        id: `${shortid.generate()}${moment().format('HHmmss')}`,
        expedition: parameter.type,
        parameter: JSON.stringify(payload),
      },
      { transaction: dbTransaction },
    );
    await dbTransaction.commit();
    resolve(true);
  } catch (error) {
    await dbTransaction.rollback();
    reject(error);
  }
});

const orderFailedLogger = async (parameter) => new Promise(async (resolve, reject) => {
  const dbTransaction = await sequelize.transaction();

  const payload = { ...parameter };
  delete payload.batchId;

  try {
    await OrderFailed.create(
      {
        id: `${shortid.generate()}${moment().format('HHmmss')}`,
        batchId: parameter.batchId,
        payload: JSON.stringify(payload),
      },
      { transaction: dbTransaction },
    );
    await dbTransaction.commit();
    resolve(true);
  } catch (error) {
    await dbTransaction.rollback();
    reject(error);
  }
});

module.exports = {
  resiMapper,
  shippingFee,
  orderLogger,
  batchCreator,
  orderSuccessLogger,
  orderFailedLogger,
};
