const moment = require('moment');
const shortid = require('shortid-36');
const jne = require('../../../../../helpers/jne');
const jwtSelector = require('../../../../../helpers/jwt-selector');
const { orderStatus } = require('../../../../../constant/status');
const snakeCaseConverter = require('../../../../../helpers/snakecase-converter');
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

      this.origin = this.sellerAddress.location;
      this.destination = await this.location.findOne({ where: { id: body.receiver_location_id } });
      this.shippingFee = await this.shippingFee();
      this.parameter = await this.paramsMapper();

      const jneCondition = (this.origin.jneOriginCode !== '' && this.destination.jneDestinationCode !== '');
      if (!jneCondition) throw new Error(`Origin or destination code for ${body.type} not setting up yet!`);
      if (!this.shippingFee) throw new Error('Service for this destination not found!');

      const paramFormatted = await this.caseConverter();
      const order = await this.jne.createOrder(paramFormatted);
      const orderId = await this.insertLog(order);

      return {
        order_id: orderId,
        resi: order?.length > 0 ? order[0].cnote_no : '',
      };
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async shippingFee() {
    try {
      const { body } = this.request;
      const prices = await this.jne.checkPrice({
        origin: this.origin.jneOriginCode,
        destination: this.destination.jneDestinationCode,
        weight: body.weight,
      });

      const service = await prices?.find((item) => item.service_code === body.service_code);

      return service?.price;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async insertLog(orderResponse) {
    const dbTransaction = await sequelize.transaction();

    try {
      const orderQuery = await this.orderQuery(orderResponse);
      const orderDetailQuery = await this.orderQueryDetail();
      const orderAddressQuery = await this.orderQueryAddress();

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
        { previousStatus: orderStatus.WAITING_PICKUP, orderId: order.id },
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
      return order.id;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async caseConverter() {
    return Object.keys(this.parameter).reduce((accumulator, key) => {
      accumulator[key.toUpperCase()] = this.parameter[key];
      return accumulator;
    }, {});
  }

  async orderQuery(order) {
    const { body } = this.request;

    return {
      resi: order?.length > 0 ? order[0].cnote_no : '',
      expedition: body.type,
      serviceCode: body.service_code,
      isCod: body.is_cod,
      orderDate: body.pickup_date,
      orderTime: body.pickup_time,
      totalAmount: parseFloat(body.goods_amount) + parseFloat(this.shippingFee),
      status: orderStatus.WAITING_PICKUP,
    };
  }

  async orderQueryDetail() {
    const { body } = this.request;

    return {
      sellerId: this.sellerData?.id,
      sellerAddressId: this.sellerAddress?.id,
      weight: body.weight,
      totalItem: body.goods_qty,
      notes: body.notes,
      goodsContent: body.goods_content,
      goodsPrice: body.goods_amount,
      shippingCharge: this.shippingFee,
      useInsurance: body.is_insurance,
      insuranceAmount: 0,
      isTrouble: false,
    };
  }

  async orderQueryAddress() {
    const { body } = this.request;

    return {
      senderName: body.sender_name,
      senderPhone: body.sender_phone,
      receiverName: body.receiver_name,
      receiverPhone: body.receiver_phone,
      receiverAddress: body.receiver_address,
      receiverAddressNote: body.receiver_address_note,
      receiverLocationId: body.receiver_location_id,
    };
  }

  async paramsMapper() {
    const { body } = this.request;

    return {
      pickup_name: this.sellerData?.name || '',
      pickup_date: body.pickup_date.split('-').reverse().join('-'),
      pickup_time: body.pickup_time,
      pickup_pic: this.sellerAddress?.picName || '',
      pickup_pic_phone: this.sellerAddress?.picPhoneNumber || '',
      pickup_address: this.sellerAddress?.address || '',
      pickup_district: this.origin?.district || '',
      pickup_city: this.origin?.city || '',
      pickup_service: 'Domestic',
      pickup_vechile: body.should_pickup_with,
      branch: this.origin?.jneOriginCode || '',
      cust_id: body.is_cod ? process.env.JNE_CUSTOMER_COD : process.env.JNE_CUSTOMER_NCOD,
      order_id: `${shortid.generate()}${moment().format('YYMDHHmmss')}`,
      shipper_name: body.sender_name || '',
      shipper_addr1: this.sellerAddress?.address?.slice(0, 80) || '',
      shipper_city: this.origin?.city || '',
      shipper_zip: this.origin?.postalCode || '',
      shipper_region: this.origin?.province || '',
      shipper_country: 'Indonesia',
      shipper_contact: body.sender_name,
      shipper_phone: this.sellerAddress?.picPhoneNumber || '',
      receiver_name: body.receiver_name,
      receiver_addr1: body.receiver_address,
      receiver_city: this.destination?.city || '',
      receiver_zip: this.destination?.postalCode || '',
      receiver_region: this.destination?.province || '',
      receiver_country: 'Indonesia',
      receiver_contact: body.receiver_name,
      receiver_phone: body.receiver_phone,
      origin_code: this.origin?.jneOriginCode || '',
      destination_code: this.destination?.jneDestinationCode || '',
      service_code: body.service_code,
      weight: body.weight,
      qty: body.goods_qty,
      goods_desc: body.notes,
      goods_amount: body.goods_amount,
      insurance_flag: body.is_insurance ? 'Y' : 'N',
      special_ins: '',
      merchant_id: this.sellerData.id,
      type: 'PICKUP',
      cod_flag: body.is_cod ? 'YES' : 'NO',
      cod_amount: body?.goods_amount,
      awb: `${process.env.JNE_ORDER_PREFIX}${shortid.generate()}`,
    };
  }
};
