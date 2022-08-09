const shortid = require('shortid-36');
const orderStatus = require('../constant/order-status');
const tax = require('../constant/tax');
const {
  Order,
  OrderTax,
  OrderLog,
  Discount,
  sequelize,
  OrderDetail,
  OrderAddress,
  SellerDetail,
  OrderDiscount,
  TransactionFee,
} = require('../app/models');

const receiverAmount = (params) => new Promise((resolve, reject) => {
  try {
    resolve(params);
  } catch (error) {
    reject(error?.message);
  }
});

const orderQuery = async (payload) => {
  // eslint-disable-next-line no-unused-vars
  const { body } = this.request;

  return {
    batchId: this.createBatch.id,
    orderCode: shortid.generate(),
    resi: payload.resi,
    expedition: payload.type,
    serviceCode: payload.service_code,
    isCod: payload.is_cod,
    orderDate: payload.pickup_date,
    orderTime: payload.pickup_time,
    status: orderStatus.WAITING_PICKUP.text,
  };
};

const orderQueryDetail = async (payload) => {
  const calculateFee = await this.receivedFeeFormula(payload);
  const trxFee = await TransactionFee.findOne();

  return {
    batchId: this.createBatch.id,
    sellerId: this.sellerData?.id,
    sellerAddressId: this.sellerAddress?.id,
    weight: payload.weight,
    totalItem: payload.goods_qty,
    notes: payload.notes,
    goodsContent: payload.goods_content,
    goodsPrice: !payload.is_cod ? payload.goods_amount : 0.00,
    codFee: payload.is_cod ? payload.cod_value : 0.00,
    shippingCharge: payload.shippingFee,
    useInsurance: payload.is_insurance,
    sellerReceivedAmount: calculateFee,
    insuranceAmount: payload?.insuranceSelected?.insuranceValue || 0,
    isTrouble: false,
    codFeeAdmin: trxFee?.codFee || 0,
    codFeeAdminType: trxFee?.codFeeType || '',
  };
};

const orderQueryAddress = async (payload) => {
  // eslint-disable-next-line no-unused-vars
  const { body } = this.request;

  return {
    senderName: payload.sender_name,
    senderPhone: payload.sender_phone,
    receiverName: payload.receiver_name,
    receiverPhone: payload.receiver_phone,
    receiverAddress: payload.receiver_address,
    receiverAddressNote: payload.receiver_address_note,
    receiverLocationId: payload.receiver_location_id,
  };
};

const orderQueryTax = async (payload) => {
  // eslint-disable-next-line no-unused-vars
  const { body } = this.request;
  const { vat, vatType } = tax;

  return {
    taxAmount: (parseFloat(payload?.shippingFee) * parseFloat(vat)) / 100,
    taxType: 'AMOUNT',
    vatTax: vat,
    vatType,
  };
};

const orderQueryDiscount = async () => {
  const { body } = this.request;
  const sellerDiscount = this.sellerData.sellerDetail.discount;
  const sellerDiscountType = this.sellerData.sellerDetail.discountType;
  const globalDiscount = await Discount.findOne({
    where: {
      [this.op.or]: {
        minimumOrder: {
          [this.op.gte]: 0,
        },
        maximumOrder: {
          [this.op.lte]: body.order_items.length,
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
    parseFloat(this.sellerData.sellerDetail.credit) - parseFloat(payload.goodsAmount)
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
    const orderDiscountQuery = await orderQueryDiscount();
    const orderDetailQuery = await orderQueryDetail(params);
    const orderAddressQuery = await orderQueryAddress(params);
    const querySellerDetail = await sellerDetailQuery(params);

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
        { where: { sellerId: this.sellerData.id } },
        { transaction: dbTransaction },
      );
    }

    await dbTransaction.commit();
    resolve(order);
  } catch (error) {
    await dbTransaction.rollback();
    reject(error?.message);
  }
});

module.exports = {
  orderLogger,
  receiverAmount,
};
