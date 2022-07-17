const moment = require('moment');
const shortid = require('shortid-36');
const { Sequelize } = require('sequelize');
const jne = require('../../../../../helpers/jne');
const jwtSelector = require('../../../../../helpers/jwt-selector');
const orderStatus = require('../../../../../constant/order-status');
const snakeCaseConverter = require('../../../../../helpers/snakecase-converter');
const { formatCurrency } = require('../../../../../helpers/currency-converter');
const {
  Location,
  Seller,
  Order,
  OrderLog,
  OrderDetail,
  OrderAddress,
  SellerAddress,
  sequelize,
} = require('../../../../models');

module.exports = class {
  constructor({ request }) {
    this.jne = jne;
    this.order = Order;
    this.seller = Seller;
    this.op = Sequelize.Op;
    this.request = request;
    this.location = Location;
    this.orderLog = OrderLog;
    this.address = SellerAddress;
    this.orderDetail = OrderDetail;
    this.orderAddress = OrderAddress;
    this.converter = snakeCaseConverter;
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
          const origin = this.sellerAddress.location;
          const destination = await this.location.findOne({
            where: { id: item.receiver_location_id },
          });

          const jneCondition = (origin.jneOriginCode !== '' && destination.jneDestinationCode !== '');
          const shippingFee = await this.shippingFee({ origin, destination, weight: item.weight });

          const payload = {
            origin,
            shippingFee,
            destination,
            ...body,
            ...item,
          };

          const parameter = await this.paramsMapper({ payload });
          const codCondition = (item.is_cod)
            ? (this.codValidator({ payload }))
            : true;

          if (!jneCondition) throw new Error(`Origin or destination code for ${body.type} not setting up yet!`);

          if (shippingFee && codCondition) {
            const paramFormatted = await this.caseConverter({ parameter });
            const order = await this.jne.createOrder(paramFormatted);
            const resi = order?.length > 0 ? order[0].cnote_no : '';

            const orderId = await this.insertLog({ ...payload, resi });
            const totalAmount = parseFloat(payload.goods_amount) + parseFloat(payload.shippingFee);

            result = [{
              resi,
              order_id: orderId,
              order: {
                order_id: orderId,
                service: payload.type,
                service_code: payload.service_code,
                weight: payload.weight,
                goods_content: payload.goods_content,
                goods_amount: payload.gppds_amount,
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

      return response;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  codValidator({ payload }) {
    const { body } = this.request;
    const ninjaCondition = (body.type === 'NINJA');
    const sicepatCondition = (
      body.type === 'SICEPAT'
      && (body.service_code === 'GOKIL' || body.service_code === 'BEST' || body.service_code === 'SIUNT')
      && parseFloat(payload.goods_amount) <= parseFloat(15000000)
    );

    const jneCondition = (
      body.type === 'JNE'
      && payload.weight <= 70
      && parseFloat(payload.goods_amount) <= parseFloat(5000000)
    );

    if (sicepatCondition) return true;
    if (jneCondition) return true;
    if (ninjaCondition) return true;
    return false;
  }

  async shippingFee({ origin, destination, weight }) {
    try {
      const { body } = this.request;
      const prices = await this.jne.checkPrice({
        origin: origin.jneOriginCode,
        destination: destination.jneDestinationCode,
        weight,
      });

      const service = await prices?.find((item) => item.service_code === body.service_code);

      return service?.price;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async insertLog(payload) {
    const dbTransaction = await sequelize.transaction();

    try {
      const orderQuery = await this.orderQuery(payload);
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

      await dbTransaction.commit();
      return order.id;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async caseConverter({ parameter }) {
    // eslint-disable-next-line no-unused-vars
    const { body } = this.request;

    return Object.keys(parameter).reduce((accumulator, key) => {
      accumulator[key.toUpperCase()] = parameter[key];
      return accumulator;
    }, {});
  }

  async orderQuery(payload) {
    // eslint-disable-next-line no-unused-vars
    const { body } = this.request;

    return {
      orderCode: shortid.generate(),
      resi: payload.resi,
      expedition: payload.type,
      serviceCode: payload.service_code,
      isCod: payload.is_cod,
      orderDate: payload.pickup_date,
      orderTime: payload.pickup_time,
      totalAmount: parseFloat(payload.goods_amount) + parseFloat(payload.shippingFee),
      status: orderStatus.WAITING_PICKUP.text,
    };
  }

  async orderQueryDetail(payload) {
    // eslint-disable-next-line no-unused-vars
    const { body } = this.request;

    return {
      sellerId: this.sellerData?.id,
      sellerAddressId: this.sellerAddress?.id,
      weight: payload.weight,
      totalItem: payload.goods_qty,
      notes: payload.notes,
      goodsContent: payload.goods_content,
      goodsPrice: payload.goods_amount,
      shippingCharge: payload.shippingFee,
      useInsurance: payload.is_insurance,
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

  async paramsMapper({ payload }) {
    return {
      pickup_name: this.sellerData?.name || '',
      pickup_date: payload.pickup_date.split('-').reverse().join('-'),
      pickup_time: payload.pickup_time,
      pickup_pic: this.sellerAddress?.picName || '',
      pickup_pic_phone: this.sellerAddress?.picPhoneNumber || '',
      pickup_address: this.sellerAddress?.address || '',
      pickup_district: payload.origin?.district || '',
      pickup_city: payload.origin?.city || '',
      pickup_service: 'Domestic',
      pickup_vechile: payload.should_pickup_with,
      branch: payload.origin?.jneOriginCode || '',
      cust_id: payload.is_cod ? process.env.JNE_CUSTOMER_COD : process.env.JNE_CUSTOMER_NCOD,
      order_id: `${shortid.generate()}${moment().format('YYMDHHmmss')}`,
      shipper_name: payload.sender_name || '',
      shipper_addr1: this.sellerAddress?.address?.slice(0, 80) || '',
      shipper_city: payload.origin?.city || '',
      shipper_zip: payload.origin?.postalCode || '',
      shipper_region: payload.origin?.province || '',
      shipper_country: 'Indonesia',
      shipper_contact: payload.sender_name,
      shipper_phone: this.sellerAddress?.picPhoneNumber || '',
      receiver_name: payload.receiver_name,
      receiver_addr1: payload.receiver_address,
      receiver_city: payload.destination?.city || '',
      receiver_zip: payload.destination?.postalCode || '',
      receiver_region: payload.destination?.province || '',
      receiver_country: 'Indonesia',
      receiver_contact: payload.receiver_name,
      receiver_phone: payload.receiver_phone,
      origin_code: payload.origin?.jneOriginCode || '',
      destination_code: payload.destination?.jneDestinationCode || '',
      service_code: payload.service_code,
      weight: payload.weight,
      qty: payload.goods_qty,
      goods_desc: payload.goods_content,
      goods_amount: payload.goods_amount,
      insurance_flag: payload.is_insurance ? 'Y' : 'N',
      special_ins: '',
      merchant_id: this.sellerData.id,
      type: 'PICKUP',
      cod_flag: payload.is_cod ? 'YES' : 'NO',
      cod_amount: payload?.goods_amount,
      awb: `${process.env.JNE_ORDER_PREFIX}${shortid.generate()}`,
    };
  }
};
