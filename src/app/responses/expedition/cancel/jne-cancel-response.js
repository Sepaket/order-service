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
      const order = await this.order.findOne({ where: { resi: body.resi } });
      const orderAddress = await this.orderAddress.findOne({
        where: { orderId: order.id },
        include: [
          {
            model: this.location,
            as: 'location',
            required: false,
          },
        ],
      });

      const orderDetail = await this.orderDetail.findOne({
        where: { orderId: order.id },
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

      const payload = {
        order,
        orderDetail,
        orderAddress,
      };

      if (!orderDetail || !orderAddress) throw new Error('This order has incomplete data');
      const parameter = await this.paramsMapper({ payload });
      const paramFormatted = await this.caseConverter({ parameter });
      const canceled = await this.jne.cancel(paramFormatted);

      if (canceled[0]?.status) this.insertLog();

      return true;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async insertLog() {
    const { body } = this.request;
    const dbTransaction = await sequelize.transaction();

    try {
      const order = await this.order.findOne({ where: { resi: body.resi } });

      await this.order.update(
        { status: orderStatus.CANCELED.text },
        { where: { id: order.id } },
        { transaction: dbTransaction },
      );

      await this.orderLog.create(
        {
          previousStatus: order.status,
          currentStatus: orderStatus.CANCELED.text,
          orderId: order.id,
        },
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
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

  async paramsMapper({ payload }) {
    const { body } = this.request;

    return {
      pickup_name: payload.orderDetail.seller.name,
      pickup_date: payload.order.orderDate.split('-').reverse().join('-'),
      pickup_time: payload.order.orderTime,
      pickup_pic: payload.orderDetail.sellerAddress.picName,
      pickup_pic_phone: payload.orderDetail.sellerAddress.picPhoneNumber,
      pickup_address: payload.orderDetail.sellerAddress.address,
      pickup_district: payload.orderDetail.sellerAddress?.location?.district || '',
      pickup_city: payload.orderDetail.sellerAddress?.location?.city || '',
      pickup_service: 'Domestic',
      pickup_vechile: 'MOTOR',
      branch: payload.orderDetail.sellerAddress?.location?.jneOriginCode || '',
      cust_id: payload.order.is_cod ? process.env.JNE_CUSTOMER_COD : process.env.JNE_CUSTOMER_NCOD,
      order_id: `${shortid.generate()}${moment().format('YYMDHHmmss')}`,
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
      special_ins: '',
      merchant_id: payload.orderDetail.sellerId,
      type: 'DROP',
      cod_flag: payload.order.isCod ? 'YES' : 'NO',
      cod_amount: payload?.orderDetail.goodsPrice,
      awb: body.resi,
    };
  }
};
