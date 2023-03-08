require('dotenv').config();
const moment = require('moment');
const random = require('random-number');
const shortid = require('shortid-36');
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
  sequelize,
  OrderBatch,
  OrderDetail,
  OrderAddress,
  OrderFailed,
  SellerDetail,
  OrderDiscount,
  OrderBackground,
  TransactionFee,
} = require('../app/models');
// const { transactionFee } = require('../app/controllers/expedition/order-controller');

const batchCreator = (params) => new Promise(async (resolve, reject) => {
  const {
    dbTransaction,
    expedition,
    sellerId,
    totalOrder,
    batchCode,
  } = params;
  try {
    console.log('inside order - helper batch creator 1');
    console.log(expedition);
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
    console.log(error);
    await dbTransaction.rollback();
    reject(error);
  }
});

function zerofill(number, length) {
  let output = number.toString();
  while (output.length < length) {
    output = `0${output}`;
  }
  return output;
}

const resiMapper = (params) => new Promise(async (resolve, reject) => {
  try {
    let resi = '';

    const {
      expedition, currentResi, id, batchId,
    } = params;
    // console.log(`resimapper next Id to insert to orders : ${id}`);
    // console.log(params);
    const ninjaResi = `
      ${process.env.NINJA_ORDER_PREFIX}
      ${await random({ min: 10000, max: 99999, integer: true })}
      ${moment().format('ss')}${moment()?.valueOf()?.toString()?.substring(0, 2)}
      ${id.length > 1 ? id : `0${id}`}
    `;
    /*
    reno
    untuk generation jneResi :
    JNE PREFIX
    timestamp di potong sampai 8 digit
    random 3 karakter
    id

    const jneResi-deprecated = `
      ${process.env.JNE_ORDER_PREFIX}
      ${await random({ min: 10000, max: 99999, integer: true })}
      ${moment().format('ss')}${moment()?.valueOf()?.toString()?.substring(0, 2)}
      ${id.length > 1 ? id : `0${id}`}
    `;
*/
    // const jneResi = `
    //   ${process.env.JNE_ORDER_PREFIX}
    //   ${zerofill(currentResi,7)}
    //   ${await random({ min: 1000, max: 9999, integer: true })}
    // `;

    const resitail = zerofill(currentResi.toString(), 10).substring(10, 4);
    const batchno = zerofill(batchId.toString(), 4).substring(0, 4);
    const idno = zerofill(id.toString(), 3);
    const jneResi = `
      ${process.env.JNE_ORDER_PREFIX}
      ${moment()?.format('x')?.valueOf()?.toString()
    ?.substring(1, 4)}
      ${batchno}
      ${idno}
      ${await random({ min: 0, max: 9, integer: true })}
    `;
    // console.log(resitail);
    // console.log(currentResi);
    console.log(`jne resi : ${jneResi}`);

    // console.log('jneResi : ' + jneResi);
    let sicepatResi = `${process.env.SICEPAT_CUSTOMER_ID}`;
    const currentResiString = currentResi.toString();
    if (currentResiString.length === 1) sicepatResi = `${sicepatResi}${`000${currentResi}`}`;
    if (currentResiString.length === 2) sicepatResi = `${sicepatResi}${`00${currentResi}`}`;
    if (currentResiString.length === 3) sicepatResi = `${sicepatResi}${`0${currentResi}`}`;
    if (currentResiString.length === 4) sicepatResi = `${sicepatResi}${currentResi}`;

    if (expedition === 'SICEPAT') resi = sicepatResi;
    if (expedition === 'JNE') resi = jneResi.replace(/\r?\n|\r/g, '').replace(/\s{6,}/g, '').trim();
    if (expedition === 'NINJA') resi = ninjaResi.replace(/\r?\n|\r/g, '').replace(/\s{6,}/g, '').trim();
    console.log('expedition : '.expedition);
    // console.log('resi : ' + resi);
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

      const service = await prices?.find((item) => {
        if (item.service_code === 'CTC19' && serviceCode === 'REG19') return item;
        return item.service_code === serviceCode;
      });

      price = service?.price || 0;
    }

    if (expedition === 'NINJA') {
      const prices = await ninja.checkPrice({
        origin: origin?.ninjaOriginCode + ',' + origin?.ninjaDestinationCode,
        destination: destination?.ninjaOriginCode + ',' + destination?.ninjaDestinationCode,
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
  console.log('order query detail');
  const fee = await TransactionFee.findByPk('1');
  console.log(fee.rateReferal);
  console.log(payload);
  const mapped = payload.items.map((item, idx) => ({
    batchId: item.batchId,
    sellerId: item.seller.id,
    sellerAddressId: item.sellerLocation?.id,
    weight: item.weight,
    volume: item.should_pickup_with,
    totalItem: item.goods_qty,
    notes: item.notes,
    goodsContent: item.goods_content,
    goodsPrice: !item.is_cod ? item.goods_amount : 0.00,
    codFee: item.is_cod ? item.cod_value : 0.00,
    shippingCharge: item.shippingCharge,
    shippingCalculated: item.shippingCalculated,
    useInsurance: item.is_insurance,
    sellerReceivedAmount: calculateFee[idx],
    insuranceAmount: item.is_insurance ? item?.insuranceSelected || 0 : 0,
    isTrouble: false,
    codFeeAdmin: item.codFeeAdmin || 0,
    codFeeAdminType: '',
    referralRate: item.referralRate ? item.referralRate : fee.rateReferal,
    referralRateType: item.referralRateType ? item.referralRateType : fee.rateReferalType,
    referredSellerId: item.referredSellerId,
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
    hideInResi: item.sellerLocation.hideInResi,
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
  const mapped = payload?.map((item) => ({
    value: item.discuontSelected || 0,
  }));

  return mapped;
};

const orderLogger = (params) => new Promise(async (resolve, reject) => {
  console.log('order logger');
  const dbTransaction = await sequelize.transaction();

  try {
    const queryOrder = await orderQuery(params.items);
    // console.log(params)
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

    let calculatedCredit = parseFloat(seller.credit);
    params.items?.map((item) => {
      if (!item.is_cod) calculatedCredit -= parseFloat(item.shippingCalculated);
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
    console.log(error);
    await dbTransaction.rollback();
    reject(error);
  }
});

const orderSuccessLogger = (parameter) => new Promise(async (resolve, reject) => {
  // console.log('order success logger');
  const dbTransaction = await sequelize.transaction();

  try {
    const queryMapped = parameter.map((item) => {
      const payload = { ...item };
      delete payload.type;

      return {
        id: `${shortid.generate()}${moment().format('HHmmss')}`,
        resi: item.resi,
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
  // console.log('order failed logger');
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
