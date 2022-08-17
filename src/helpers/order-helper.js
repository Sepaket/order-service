require('dotenv').config();
const moment = require('moment');
const shortid = require('shortid-36');
const { Sequelize } = require('sequelize');
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
    const { expedition, id } = params;
    const sicepatResi = `${process.env.SICEPAT_CUSTOMER_ID}${moment().format('mmss')}${id.length > 1 ? id : `0${id}`}`;
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

const orderQuery = async (payload) => {
  const mapped = payload?.map((item) => ({
    batchId: item.batchId,
    orderCode: item.orderCode,
    resi: item.resi,
    expedition: item.type,
    serviceCode: item.service_code,
    isCod: item.is_cod || false,
    orderDate: item.pickup_date,
    orderTime: item.pickup_time,
    status: orderStatus.WAITING_PICKUP.text,
  }));

  return mapped;
};

const orderQueryDetail = async (payload) => {
  const calculateFee = await profitHandler(payload);

  const mapped = payload.items.map((item, idx) => ({
    batchId: item.batchId,
    sellerId: item.seller.id,
    sellerAddressId: item.sellerLocation?.id,
    weight: item.weight,
    totalItem: item.goods_qty,
    notes: item.notes,
    goodsContent: item.goods_content,
    goodsPrice: !item.is_cod ? item.goods_amount : 0.00,
    codFee: item.is_cod ? item.cod_value : 0.00,
    shippingCharge: item.shippingCalculated,
    useInsurance: item.is_insurance,
    sellerReceivedAmount: calculateFee[idx],
    insuranceAmount: item.is_insurance ? item?.insuranceSelected || 0 : 0,
    isTrouble: false,
    codFeeAdmin: item.codFeeAdmin || 0,
    codFeeAdminType: '',
  }));

  return mapped;
};

const orderQueryAddress = async (payload) => {
  const mapped = payload?.map((item) => ({
    senderName: item.sender_name,
    senderPhone: item.sender_phone,
    receiverName: item.receiver_name,
    receiverPhone: item.receiver_phone,
    receiverAddress: item.receiver_address,
    receiverAddressNote: item.receiver_address_note,
    receiverLocationId: item.receiver_location_id,
  }));

  return mapped;
};

const orderQueryTax = async (payload) => {
  const { vat, vatType } = tax;
  const mapped = payload?.map((item) => ({
    taxAmount: (parseFloat(item?.shippingCharge) * parseFloat(vat)) / 100,
    taxType: 'AMOUNT',
    vatTax: vat,
    vatType,
  }));

  return mapped;
};

const orderQueryDiscount = async (payload) => {
  const globalDiscount = await Discount.findOne({
    where: {
      [Sequelize.Op.or]: {
        minimumOrder: {
          [Sequelize.Op.gte]: 0,
        },
        maximumOrder: {
          [Sequelize.Op.lte]: payload.length,
        },
      },
    },
  });

  const mapped = payload?.map((item) => {
    const sellerDiscount = item.seller.sellerDetail.discount;
    const sellerDiscountType = item.seller.sellerDetail.discountType;

    return {
      discountSeller: sellerDiscount || 0,
      discountSellerType: sellerDiscountType || '',
      discountProvider: 0,
      discountProviderType: 'PERCENTAGE',
      discountGlobal: globalDiscount?.value || 0,
      discountGlobalType: globalDiscount?.type || '',
    };
  });

  return mapped;
};

const orderLogger = (params) => new Promise(async (resolve, reject) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const queryOrder = await orderQuery(params.items);

    const seller = await SellerDetail.findOne({
      where: { sellerId: params.sellerId },
    });

    const orders = await Order.bulkCreate(
      queryOrder,
      { transaction: dbTransaction },
    );

    const orderTaxQueries = await orderQueryTax(params.items);
    const orderDetailQueries = await orderQueryDetail(params);
    const orderAddressQueries = await orderQueryAddress(params.items);
    const orderDiscountQueries = await orderQueryDiscount(params.items);
    const orderDetail = orders?.map((item, idx) => ({
      orderId: item.id,
      ...orderDetailQueries[idx],
    }));

    const orderTax = orders?.map((item, idx) => ({
      orderId: item.id,
      ...orderTaxQueries[idx],
    }));

    const orderAddress = orders?.map((item, idx) => ({
      orderId: item.id,
      ...orderAddressQueries[idx],
    }));

    const orderDiscount = orders?.map((item, idx) => ({
      orderId: item.id,
      ...orderDiscountQueries[idx],
    }));

    const orderLog = orders?.map((item) => ({
      orderId: item.id,
      previousStatus: orderStatus.WAITING_PICKUP.text,
    }));

    let calculatedCredit = seller.credit;
    params.items?.map((item) => {
      if (item.is_cod) calculatedCredit -= item.goodsAmount;
      return calculatedCredit;
    });

    await OrderDetail.bulkCreate(
      orderDetail,
      { transaction: dbTransaction },
    );

    await OrderAddress.bulkCreate(
      orderAddress,
      { transaction: dbTransaction },
    );

    await OrderLog.bulkCreate(
      orderLog,
      { transaction: dbTransaction },
    );

    await OrderTax.bulkCreate(
      orderTax,
      { transaction: dbTransaction },
    );

    await OrderDiscount.bulkCreate(
      orderDiscount,
      { transaction: dbTransaction },
    );

    await SellerDetail.update(
      { credit: calculatedCredit },
      { where: { sellerId: params.sellerId } },
      { transaction: dbTransaction },
    );

    await dbTransaction.commit();
    resolve(true);
  } catch (error) {
    await dbTransaction.rollback();
    reject(error);
  }
});

const orderSuccessLogger = (parameter) => new Promise(async (resolve, reject) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const queryMapped = parameter.map((item) => {
      const payload = { ...item };
      delete payload.type;

      return {
        id: `${shortid.generate()}${moment().format('HHmmss')}`,
        expedition: item.type,
        parameter: JSON.stringify(payload),
      };
    });

    await OrderBackground.bulkCreate(
      queryMapped,
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
