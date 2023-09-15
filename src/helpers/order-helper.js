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
const sap = require('./sap');
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
  OrderHistory,
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
    const resitail = zerofill(currentResi.toString(), 10).substring(10, 4);
    const batchno = zerofill(batchId.toString(), 4).substring(0, 4);
    const idno = zerofill(id.toString(), 3);


    const ninjaResi = `
      ${process.env.NINJA_ORDER_PREFIX}
      ${moment()?.format('x')?.valueOf()?.toString()?.substring(1, 4)}
      ${batchno}
      ${idno}
      ${await random({ min: 0, max: 9, integer: true })}
    `;

    const jneResi = `
      ${process.env.JNE_ORDER_PREFIX}
      ${moment()?.format('x')?.valueOf()?.toString()?.substring(1, 4)}
      ${batchno}
      ${idno}
      ${await random({ min: 0, max: 9, integer: true })}
    `;
    const sapResi = `
      ${process.env.SAP_ORDER_PREFIX}
      ${moment()?.format('x')?.valueOf()?.toString()?.substring(1, 4)}
      ${batchno}
      ${idno}
      ${await random({ min: 0, max: 9, integer: true })}
    `;



    // let sicepatResi = `${process.env.SICEPAT_CUSTOMER_ID}`;
    // const currentResiString = currentResi.toString();
    // if (currentResiString.length === 1) sicepatResi = `${sicepatResi}${`000${currentResi}`}`;
    // if (currentResiString.length === 2) sicepatResi = `${sicepatResi}${`00${currentResi}`}`;
    // if (currentResiString.length === 3) sicepatResi = `${sicepatResi}${`0${currentResi}`}`;
    // if (currentResiString.length === 4) sicepatResi = `${sicepatResi}${currentResi}`;

    if (expedition === 'SICEPAT') resi = currentResi.toString();
    if (expedition === 'JNE') resi = jneResi.replace(/\r?\n|\r/g, '').replace(/\s{6,}/g, '').trim();
    if (expedition === 'NINJA') resi = ninjaResi.replace(/\r?\n|\r/g, '').replace(/\s{6,}/g, '').trim();
    if (expedition === 'SAP') resi = sapResi.replace(/\r?\n|\r/g, '').replace(/\s{6,}/g, '').trim();
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
        if (item.service_code === 'CTC23' && serviceCode === 'JNECOD') {
          console.log('jnecod dan ctc23');
          return item;
        }
        if (item.service_code === 'CTCYES23' && serviceCode === 'YES23') return item;
        if (item.service_code === 'CTCSPS23' && serviceCode === 'SPS23') return item;
        if (item.service_code === 'CTC23' && serviceCode === 'REG23') return item;
        return item.service_code === serviceCode;
      });

      price = service?.price || 0;
    }

    if (expedition === 'NINJA') {
      console.log('NINJA find price');
      const prices = await ninja.checkPrice({
        origin: origin?.ninjaOriginCode + ',' + origin?.ninjaDestinationCode,
        destination: destination?.ninjaOriginCode + ',' + destination?.ninjaDestinationCode,
        service: serviceCode,
        weight,
      });

      price = prices || 0;
    }

    if (expedition === 'SICEPAT') {
      // console.log('sicepaet origin code ', origin);
      // console.log('si cepat dest code ', destination);
      const prices = await sicepat.checkPrice({
        origin: origin?.sicepatOriginCode,
        destination: destination?.sicepatDestinationCode,
        weight,
      });
      // console.log('inside si cepat shipping fee ', prices);
      const service = await prices?.find((item) => item.service === serviceCode);
      price = service?.tariff || 0;
    }

    if (expedition === 'SAP') {
      // console.log("SAP CHECK PRICE");
      // console.log(origin);


      // const prices = await sap.checkPrice({
      //   origin: origin?.sapOriginCode,
      //   destination: destination?.sapDestinationCode,
      //   weight,
      // });

      const sap_price_response = '{"origin":"JB07","destination":"JB07","weight":"1","coverage_cod":true,"price":{"REG": 17500},"price_detail":{"DRGREG":{"service_type_code":"UDRREG","service_type_name":"REGULAR","unit_price":"3500","minimum_kilo":5,"price":17500,"sla":"2-3 Hari","sla_min":"2","sla_max":"3","id":"374353"}},"price_array":[{"service_type_code":"UDRREG","service_type_name":"REGULAR","unit_price":"3500","minimum_kilo":5,"price":17500,"sla":"2-3 Hari","sla_min":"2","sla_max":"3","id":"374353"}]}';
      const prices_1 = JSON.parse(sap_price_response);
      const prices = prices_1.price_array //sementara sebelum bisa check fee langsung dari production

      const service = await prices?.find((item) => item.service_type_code === serviceCode);

      // NAMA service_type_code yg dikirim balik sebagai response dari SAP berbeda dengan service_type_code yg dikirim dari partner

      price = service?.price || 0;

    }

    resolve(parseFloat(price));
  } catch (error) {
    reject(error);
  }
});

const orderQuery = async (payload) => {
  // console.log('inside orderquery', payload);
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
  // console.log('calculate fee : ', calculateFee)
  // console.log('order query detail');
  const fee = await TransactionFee.findByPk('1');
  // console.log(fee.rateReferal);
  // console.log(payload);
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
  console.log(params);
  const dbTransaction = await sequelize.transaction();
  try {

    const queryOrder = await orderQuery(params.items);
    // console.log(params)
    const seller = await SellerDetail.findOne({
      where: { sellerId: params.sellerId },
    });
    // console.log('reno 0b')
    // console.log(queryOrder);
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
  // console.log('paramter map : ', parameter);
  const dbTransaction = await sequelize.transaction();
  try {

    const queryMapped = parameter.map((item) => {

      const payload = { ...item };

      // delete payload.type;

      let expedition = '';
      if (payload.type === 'NINJA') {
        let track_no = payload.requested_tracking_number;
        let ninja_resi_no = track_no.split(process.env.JNE_ORDER_PREFIX)?.pop();
        payload.requested_tracking_number = ninja_resi_no;
        expedition = item.type;
      }
      if (payload.type === 'SICEPAT') {
        expedition = item.type;
      }
      if (payload.type === 'JNE') {
        expedition = item.type;
      }
      if (payload.type === 'SAP') {
        expedition = item.type;
      }
      if (payload.type === 'LALAMOVE') {
        expedition = 'LALAMOVE';
        delete payload['type'];
        delete payload['resi'];
      }

      return {
        id: `${shortid.generate()}${moment().format('HHmmss')}`,
        resi: item.resi,
        expedition: expedition,
        parameter: JSON.stringify(payload),
      };
    });
    // console.log('0-0');
    // console.log(queryMapped);
    await OrderBackground.bulkCreate(
      queryMapped,
      { transaction: dbTransaction },
    );
    // console.log('0-1');
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


async function addOrderHistory(orderId, isCod, deltaCredit, referralCredit, isExecute, onHold,note) {
  await OrderHistory.findOne({
    where: { orderId: orderId},
  }).then(async (result) => {
    if (result === null) {
      const order = await Order.findByPk(orderId);
      console.log('addOrderHistory : ', orderId);
      const orderDetail = await OrderDetail.findOne({ where: { orderId: orderId } });

      const referralRate = Number(orderDetail.referralRate);
      const referralRateType = orderDetail.referralRateType;

      //shipping calculated di tambah kembali dengan codfreeadmin karena untuk perhitungan referal tidak menggunakan codfeeadmin
      const shippingCalculated = Number(orderDetail.shippingCalculated) - Number(orderDetail.codFeeAdmin);
      // let referralCredit = 0;
      const referredId = orderDetail.referredSellerId;
      // // console.log(orderDetail)
      // if (referralRateType === 'PERCENTAGE') {
      //   referralCredit = referralRate * shippingCalculated / 100
      // } else if (referralRateType === 'AMOUNT') {
      //   referralCredit = referralRate;
      // }

      await OrderHistory.upsert({
        orderId: orderId,
        deltaCredit: deltaCredit,
        isExecute: isExecute,
        isCod:isCod,
        provider:order.expedition,
        onHold: onHold,
        note: note,
        referralId: referredId,
        referralCredit: referralCredit,
        referralBonusExecuted: false
      });
    } else {
      console.log('order history EXISTED : DO NOTHING!');

    }

  })



}


module.exports = {
  resiMapper,
  shippingFee,
  orderLogger,
  batchCreator,
  orderSuccessLogger,
  orderFailedLogger,
  addOrderHistory,
};
