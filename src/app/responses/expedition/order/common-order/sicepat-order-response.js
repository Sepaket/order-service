const shortid = require('shortid-36');
const randomNumber = require('random-number');
const sicepat = require('../../../../../helpers/sicepat');
const jwtSelector = require('../../../../../helpers/jwt-selector');
const orderStatus = require('../../../../../constant/order-status');
const snakeCaseConverter = require('../../../../../helpers/snakecase-converter');
const { formatCurrency } = require('../../../../../helpers/currency-converter');
const {
  Seller,
  Order,
  OrderTax,
  OrderLog,
  Location,
  sequelize,
  OrderBatch,
  OrderFailed,
  OrderDetail,
  OrderAddress,
  SellerAddress,
  OrderDiscount,
} = require('../../../../models');

module.exports = class {
  constructor({ request }) {
    this.sicepat = sicepat;
    this.order = Order;
    this.seller = Seller;
    this.request = request;
    this.batch = OrderBatch;
    this.location = Location;
    this.orderTax = OrderTax;
    this.orderLog = OrderLog;
    this.address = SellerAddress;
    this.orderFailed = OrderFailed;
    this.orderDetail = OrderDetail;
    this.orderAddress = OrderAddress;
    this.orderDiscount = OrderDiscount;
    this.converter = snakeCaseConverter;

    this.vat = {
      raw: 3.33,
      calculated: (parseFloat(3.33) / parseInt(100, 10)),
      type: 'PERCENTAGE',
    };

    this.discount = {
      raw: 0.00,
      calculated: (parseFloat(0.00) / parseInt(100, 10)),
      type: 'PERCENTAGE',
    };

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
      const { body } = this.request;
      const sellerId = await jwtSelector({ request: this.request });

      this.sellerData = await this.seller.findOne({ where: { id: sellerId.id } });
      this.sellerAddress = await this.address.findOne({
        where: { id: body.seller_location_id, sellerId: sellerId.id },
        include: [
          {
            model: this.location,
            as: 'location',
            required: true,
          },
        ],
      });

      this.createBatch = await this.batch.create(
        {
          expedition: body.type,
          sellerId: this.sellerData?.id,
          batchCode: `B${body?.order_items?.length}${shortid.generate()}`,
          totalOrder: body?.order_items?.length || 0,
          totalOrderProcessed: 0,
          totalOrderSent: 0,
          totalOrderProblem: 0,
        },
        { transaction: dbTransaction },
      );

      if (!this.sellerAddress) throw new Error('Please complete your address data (Seller Address)');

      const response = await Promise.all(
        body.order_items.map(async (item) => {
          let result = [
            {
              resi: '',
              order_id: null,
              error: 'Service for this destination not found or service code does not exist when you choose COD',
              payload: item,
            },
          ];

          const resi = `${process.env.SICEPAT_CUSTOMER_ID}${randomNumber({ integer: true, max: 99999, min: 10000 })}`;
          const origin = this.sellerAddress.location;
          const destination = await this.location.findOne({
            where: { id: item.receiver_location_id },
          });

          const codFee = (parseFloat(3.33) / parseInt(100, 10));
          const shippingFee = await this.shippingFee({ origin, destination, weight: item.weight });
          const sicepatCondition = (origin.sicepatOriginCode !== '' && destination.sicepatDestinationCode !== '');
          const goodsAmount = !body.is_cod
            ? body.goods_amount
            : parseFloat(body.cod_value) - (parseFloat(shippingFee || 0) + codFee);

          const payload = {
            resi,
            origin,
            goodsAmount,
            destination,
            shippingFee,
            ...item,
            ...body,
          };

          const parameter = await this.paramsMapper({ payload });
          const codCondition = (item.is_cod) ? (this.codValidator()) : true;

          if (!sicepatCondition) throw new Error(`Origin or destination code for ${body.type} not setting up yet!`);
          if (shippingFee && codCondition) {
            const order = await this.sicepat.createOrder(parameter);
            const responseResi = order?.length > 0 ? order[0].receipt_number : '';
            const orderId = await this.insertLog({ ...payload, resi: responseResi });
            const totalAmount = payload?.is_cod
              ? parseFloat(payload?.cod_value)
              : (parseFloat(payload?.goods_amount) + parseFloat(payload?.shippingFee));

            result = [{
              resi,
              order_id: orderId.id,
              order: {
                order_code: orderId.orderCode,
                order_id: orderId.id,
                service: payload.type,
                service_code: payload.service_code,
                weight: payload.weight,
                goods_content: payload.goods_content,
                goods_qty: payload.goods_qty,
                goods_notes: payload.notes,
                insurance_amount: 0,
                is_cod: payload.is_cod,
                total_amount: {
                  raw: totalAmount,
                  formatted: formatCurrency(totalAmount, 'Rp.'),
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
                address: this.sellerAddress?.address || '',
                address_note: '',
                location: payload.origin || null,
              },
            }];
          }

          return result?.shift();
        }),
      );

      await dbTransaction.commit();
      return response;
    } catch (error) {
      await dbTransaction.rollback();

      if (error?.message?.includes('SICEPAT:')) {
        throw new Error(`${error?.message}, Please try again later`);
      }

      throw new Error(error?.message || 'Something Wrong');
    }
  }

  codValidator() {
    const { body } = this.request;
    return (body.service_code === 'SIUNT');
  }

  async shippingFee({ origin, weight, destination }) {
    try {
      const { body } = this.request;
      const prices = await this.sicepat.checkPrice({
        origin: origin.sicepatOriginCode,
        destination: destination.sicepatDestinationCode,
        weight,
      });

      const service = await prices?.find((item) => item.service === body.service_code);

      return service?.tariff;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async insertLog(payload) {
    const dbTransaction = await sequelize.transaction();

    try {
      const orderQuery = await this.orderQuery(payload);
      const orderTaxQuery = await this.orderQueryTax(payload);
      const orderDiscountQuery = await this.orderQueryDiscount();
      const orderDetailQuery = await this.orderQueryDetail(payload);
      const orderAddressQuery = await this.orderQueryAddress(payload);

      const order = await this.order.create(
        { ...orderQuery },
        { transaction: dbTransaction },
      );

      await this.orderDetail.create(
        { ...orderDetailQuery, orderId: order.id },
        { transaction: dbTransaction },
      );

      await this.orderAddress.create(
        { ...orderAddressQuery, orderId: order.id },
        { transaction: dbTransaction },
      );

      await this.orderLog.create(
        { previousStatus: orderStatus.WAITING_PICKUP.text, orderId: order.id },
        { transaction: dbTransaction },
      );

      await this.orderTax.create(
        { ...orderTaxQuery, orderId: order.id },
        { transaction: dbTransaction },
      );

      await this.orderDiscount.create(
        { ...orderDiscountQuery, orderId: order.id },
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
      return order;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async receivedFeeFormula(payload) {
    let result = 0;
    const tax = parseFloat(payload?.shippingFee) * this.vat.calculated;

    if (payload.is_cod) {
      const codFee = (parseFloat(3.33) / parseInt(100, 10));
      const codFeeSeller = parseFloat(codFee) * parseFloat(payload?.cod_value);

      const formulaOne = parseFloat(payload?.cod_value) - parseFloat(codFeeSeller);
      const formulaTwo = parseFloat(payload?.shippingFee) - parseFloat(this.discount.calculated);
      result = (formulaOne - formulaTwo) - tax;
    } else {
      const formulaOne = parseFloat(payload?.shippingFee) - parseFloat(this.discount.calculated);
      result = (payload?.goods_amount - formulaOne) - tax;
    }

    return result;
  }

  async orderQuery(payload) {
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
  }

  async orderQueryDetail(payload) {
    const calculateFee = await this.receivedFeeFormula(payload);

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
      insuranceAmount: 0,
      isTrouble: false,
    };
  }

  async orderQueryAddress(payload) {
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
  }

  async orderQueryTax(payload) {
    // eslint-disable-next-line no-unused-vars
    const { body } = this.request;

    return {
      taxAmount: parseFloat(payload?.shippingFee) * this.vat.calculated,
      taxType: 'DECIMAL',
      vatTax: this.vat.raw,
      vatType: this.vat.type,
    };
  }

  async orderQueryDiscount() {
    // eslint-disable-next-line no-unused-vars
    const { body } = this.request;

    return {
      discountSeller: this.discount.raw,
      discountSellerType: this.discount.type,
      discountProvider: this.discount.raw,
      discountProviderType: this.discount.type,
      discountGlobal: this.discount.raw,
      discountGlobalType: this.discount.type,
    };
  }

  async pickupAddress() {
    const address = this.sellerAddress;

    return `
      ${address?.address || ''},
      Kec. ${address?.location?.subDistrict || ''},
      Kota ${address?.location?.city || ''},
      ${address?.location?.province || ''},
      ${address?.location?.postalCode || ''}
    `;
  }

  async receiverAddress({ payload }) {
    // eslint-disable-next-line no-unused-vars
    const { body } = this.request;
    const address = payload.destination;

    return `
      ${payload?.address || ''},
      Kec. ${address?.subDistrict || ''},
      Kota ${address?.city || ''},
      ${address?.province || ''},
      ${address?.postalCode || ''}
    `;
  }

  async paramsMapper({ payload }) {
    const pickupAddress = await this.pickupAddress({ payload });
    const receiverAddress = await this.receiverAddress({ payload });

    return {
      reference_number: `${process.env.SICEPAT_ORDER_PREFIX}${payload.resi}`,
      pickup_request_date: `${payload.pickup_date} ${payload.pickup_time}`,
      pickup_method: 'PICKUP',
      pickup_merchant_code: `Sepaket-${this.sellerData.id}`,
      pickup_merchant_name: this.sellerAddress.picName,
      pickup_address: pickupAddress.replace(/\n/g, ' ').replace(/  +/g, ' '),
      pickup_city: this.sellerAddress?.location?.city?.toUpperCase() || '',
      pickup_merchant_phone: this.sellerAddress?.picPhoneNumber || '',
      pickup_merchant_email: this.sellerData?.email || '',
      PackageList: [
        {
          receipt_number: payload.resi,
          origin_code: payload.origin.sicepatOriginCode,
          delivery_type: payload.service_code,
          parcel_category: payload.goods_category,
          parcel_content: payload.goods_content,
          parcel_qty: payload.goods_qty,
          parcel_uom: 'Pcs',
          parcel_value: payload.goodsAmount,
          total_weight: payload.weight,
          shipper_name: payload.sender_name,
          shipper_address: pickupAddress.replace(/\n/g, ' ').replace(/  +/g, ' '),
          shipper_province: this.sellerAddress?.location?.province || '',
          shipper_city: this.sellerAddress?.location?.city || '',
          shipper_district: this.sellerAddress?.location?.district || '',
          shipper_zip: this.sellerAddress?.location?.postalCode || '',
          shipper_phone: payload.sender_phone,
          shipper_longitude: '',
          shipper_latitude: '',
          recipient_title: 'Mr',
          recipient_name: payload.receiver_name,
          recipient_address: receiverAddress.replace(/\n/g, ' ').replace(/  +/g, ' '),
          recipient_province: payload.destination.province,
          recipient_city: payload.destination.city,
          recipient_district: payload.destination.district,
          recipient_zip: payload.destination.postalCode,
          recipient_phone: payload.receiver_phone,
          recipient_longitude: '',
          recipient_latitude: '',
          destination_code: payload.destination.sicepatDestinationCode,
        },
      ],
    };
  }
};
