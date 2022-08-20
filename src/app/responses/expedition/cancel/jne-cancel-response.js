const moment = require('moment');
const shortid = require('shortid-36');
const { Sequelize } = require('sequelize');
const jne = require('../../../../helpers/jne');
const orderStatus = require('../../../../constant/order-status');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const {
  Location,
  Seller,
  Order,
  OrderLog,
  OrderDetail,
  OrderAddress,
  SellerAddress,
  OrderCanceled,
  sequelize,
} = require('../../../models');

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
    this.orderCanceled = OrderCanceled;
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
      this.orderIds = body.ids.map((item) => {
        if (item.expedition === 'JNE' && item.status !== orderStatus.CANCELED.text) return item.id;
        return null;
      }).filter((item) => item);

      if (this.orderIds.length < 1) return null;

      const orders = await this.order.findAll({
        where: { id: this.orderIds, expedition: 'JNE' },
      });

      const orderAddresses = await this.orderAddress.findAll({
        where: { orderId: this.orderIds },
        include: [
          {
            model: this.location,
            as: 'location',
            required: false,
          },
        ],
      });

      const orderDetails = await this.orderDetail.findAll({
        where: { orderId: this.orderIds },
        include: [
          {
            model: this.seller,
            as: 'seller',
            required: true,
          },
          {
            model: this.address,
            as: 'sellerAddress',
            required: true,
            include: [
              {
                model: this.location,
                as: 'location',
                required: false,
              },
            ],
          },
        ],
      });

      const payload = orders.map((item) => {
        const orderDetail = orderDetails.find((detail) => detail.orderId === item.id);
        const orderAddress = orderAddresses.find((address) => address.orderId === item.id);

        return {
          order: item,
          orderDetail,
          orderAddress,
        };
      });

      const responseMap = orders.map((order) => ({
        id: order.id,
        resi: order.resi,
        status: true,
        message: 'OK',
      }));

      if (this.orderIds.length > 0) {
        const parameter = await this.paramsMapper({ payload });
        await this.insertLog({
          payload: parameter,
          orders,
        });
      }

      return responseMap;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async insertLog(params) {
    const dbTransaction = await sequelize.transaction();

    try {
      const payloadLog = params.orders.map((item) => ({
        previousStatus: item.status,
        currentStatus: orderStatus.CANCELED.text,
        orderId: item.id,
      }));

      const payloadCanceled = params.payload.map((item) => ({
        id: `${shortid.generate()}${moment().format('HHmmss')}`,
        parameter: JSON.stringify(item),
        expedition: 'JNE',
      }));

      await this.order.update(
        { status: orderStatus.CANCELED.text },
        { where: { id: { [this.op.in]: this.orderIds } } },
        { transaction: dbTransaction },
      );

      await this.orderLog.bulkCreate(
        payloadLog,
        { transaction: dbTransaction },
      );

      await this.orderCanceled.bulkCreate(
        payloadCanceled,
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async paramsMapper({ payload }) {
    const mapped = payload.map((item) => {
      const parameter = this.parameterHandler({ payload: item });

      return Object.keys(parameter).reduce((accumulator, key) => {
        accumulator[key.toUpperCase()] = parameter[key];
        return accumulator;
      }, {});
    });

    return mapped;
  }

  // eslint-disable-next-line class-methods-use-this
  parameterHandler({ payload }) {
    return {
      pickup_name: payload.orderDetail.seller.name,
      pickup_date: payload.order.orderDate.split('-').reverse().join('-'),
      pickup_time: payload.order.orderTime,
      pickup_pic: payload.orderDetail.sellerAddress.picName,
      pickup_pic_phone: payload.orderDetail.sellerAddress.picPhoneNumber,
      pickup_address: payload.orderDetail.sellerAddress.address,
      pickup_district: payload.orderDetail.sellerAddress?.location?.district || '',
      pickup_city: payload.orderDetail.sellerAddress?.location?.city || '',
      pickup_service: 'REG',
      pickup_vechile: payload.orderDetail.volume,
      branch: payload.orderDetail.sellerAddress?.location?.jneOriginCode || '',
      cust_id: payload.order.is_cod ? process.env.JNE_CUSTOMER_COD : process.env.JNE_CUSTOMER_NCOD,
      order_id: `${shortid.generate()}${shortid.generate()}`.slice(0, 15),
      shipper_name: payload.orderAddress.senderName || '',
      shipper_addr1: payload.orderDetail.sellerAddress?.address?.slice(0, 80) || '',
      shipper_city: payload.orderDetail.sellerAddress?.location?.city || '',
      shipper_zip: payload.orderDetail.sellerAddress?.location?.postalCode || '',
      shipper_region: payload.orderDetail.sellerAddress?.location?.province || '',
      shipper_country: 'Indonesia',
      shipper_contact: payload.orderAddress.senderName,
      shipper_phone: payload.orderAddress.senderPhone || '',
      receiver_name: payload.orderAddress.receiverName,
      receiver_addr1: payload.orderAddress.receiverAddress,
      receiver_city: payload.orderAddress.location?.city || '',
      receiver_zip: payload.orderAddress.location?.postalCode || '',
      receiver_region: payload.orderAddress.location?.province || '',
      receiver_country: 'Indonesia',
      receiver_contact: payload.orderAddress.receiverName,
      receiver_phone: payload.orderAddress.receiverPhone,
      origin_code: payload.orderDetail.sellerAddress?.location?.jneOriginCode || '',
      destination_code: payload.orderAddress.location?.jneDestinationCode || '',
      service_code: payload.order.serviceCode,
      weight: payload.orderDetail.weight,
      qty: payload.orderDetail.totalItem,
      goods_desc: payload.orderDetail.goodsContent,
      goods_amount: payload.orderDetail.goodsPrice,
      insurance_flag: payload.orderDetail.useInsurance ? 'Y' : 'N',
      special_ins: payload.orderDetail.notes,
      merchant_id: payload.orderDetail.sellerId,
      type: 'DROP',
      cod_flag: payload.order.isCod ? 'Y' : 'N',
      cod_amount: payload?.orderDetail.goodsPrice,
      awb: payload.order.resi,
    };
  }
};
