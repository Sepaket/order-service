const moment = require('moment');
const shortid = require('shortid-36');
const { Sequelize } = require('sequelize');
const excelReader = require('read-excel-file/node');
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
      const fileName = body.file.split('/public/');
      if (!fileName[1]) throw new Error('File not found!');

      const result = [];
      const dataOrders = await excelReader(`public/${fileName[1]}`);
      await Promise.all(
        dataOrders.map(async (item, index) => {
          const dataOrderCondition = (
            (item[0]
            && item[0] !== ''
            && item[0] !== null)
          );

          if (index !== 0 && dataOrderCondition) {
            const excelData = {
              receiverName: item[0],
              receiverPhone: item[1],
              receiverAddress: item[2],
              receiverAddressNote: item[3],
              receiverAddressSubDistrict: item[4],
              receiverAddressPostalCode: item[5],
              weight: item[6],
              volume: item[7],
              serviceCode: item[8],
              goodsAmount: item[9],
              goodsContent: item[10],
              goodsQty: item[11],
              isInsurance: item[12],
              note: item[13],
              isCod: !!((item[9] || item[9] !== '' || item[9] !== 0)),
            };

            const origin = this.sellerAddress.location;
            const locations = await this.location.findAll({
              where: {
                [this.op.or]: {
                  subDistrict: {
                    [this.op.substring]: excelData?.receiverAddressSubDistrict?.toLowerCase(),
                  },
                  district: {
                    [this.op.substring]: excelData?.receiverAddressSubDistrict?.toLowerCase(),
                  },
                },
              },
            });

            const destination = locations?.find((location) => location.postalCode === `${excelData.receiverAddressPostalCode}`);
            const jneCondition = (origin?.jneOriginCode !== '' && destination?.jneDestinationCode !== '');
            if (!jneCondition) throw new Error(`Origin or destination code for ${body.type} not setting up yet!`);

            const shippingFee = await this.shippingFee({
              origin,
              destination,
              weight: excelData.weight,
            });

            const payload = {
              origin,
              shippingFee,
              destination,
              ...body,
              ...excelData,
            };

            const parameter = await this.paramsMapper({ payload });
            const paramFormatted = await this.caseConverter({ parameter });
            const codCondition = (excelData.isCod)
              ? (this.codValidator({ payload }))
              : true;

            if (!shippingFee || !codCondition) {
              result.push({
                resi: '',
                order_id: null,
                error: 'Service for this destination not found or service code does not exist when you choose COD',
                payload: excelData,
              });
            } else {
              const order = await this.jne.createOrder(paramFormatted);
              const resi = order?.length > 0 ? order[0].cnote_no : '';
              const orderId = await this.insertLog({ ...payload, resi });
              // result.push(orderId);
              result.push({ order_id: orderId, resi });
            }
          }

          return item;
        }),
      );

      return result;
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
      && parseFloat(payload.goodsAmount) <= parseFloat(5000000)
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
        origin: origin?.jneOriginCode || '',
        destination: destination?.jneDestinationCode || '',
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
      resi: payload.resi,
      expedition: payload.type,
      serviceCode: payload.service_code,
      isCod: payload.isCod,
      orderDate: payload.pickup_date,
      orderTime: payload.pickup_time,
      totalAmount: parseFloat(payload.goodsAmount) + parseFloat(payload.shippingFee),
      status: orderStatus.WAITING_PICKUP,
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
      useInsurance: payload.isInsurance,
      insuranceAmount: 0,
      isTrouble: false,
    };
  }

  async orderQueryAddress(payload) {
    // eslint-disable-next-line no-unused-vars
    const { body } = this.request;

    return {
      senderName: payload.sender_name || '',
      senderPhone: payload.sender_phone || '',
      receiverName: payload.receiverName,
      receiverPhone: payload.receiverPhone,
      receiverAddress: payload.receiverAddress,
      receiverAddressNote: payload.receiverAddressNote,
      receiverLocationId: payload?.destination?.id,
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
      shipper_name: payload.sender_name || this.sellerData?.name,
      shipper_addr1: this.sellerAddress?.address?.slice(0, 80) || '',
      shipper_city: payload.origin?.city || '',
      shipper_zip: payload.origin?.postalCode || '',
      shipper_region: payload.origin?.province || '',
      shipper_country: 'Indonesia',
      shipper_contact: payload.sender_name || this.sellerData?.name,
      shipper_phone: this.sellerAddress?.picPhoneNumber || '',
      receiver_name: payload.receiverName || '',
      receiver_addr1: payload.receiverAddress || '',
      receiver_city: payload.destination?.city || '',
      receiver_zip: payload.destination?.postalCode || '',
      receiver_region: payload.destination?.province || '',
      receiver_country: 'Indonesia',
      receiver_contact: payload.receiverName || '',
      receiver_phone: `${payload.receiverPhone}` || '',
      origin_code: payload.origin?.jneOriginCode || '',
      destination_code: payload.destination?.jneDestinationCode || '',
      service_code: payload.service_code,
      weight: payload.weight || '1',
      qty: payload.goodsQty || '1',
      goods_desc: payload.goodsContent || '',
      goods_amount: payload.goodsAmount || '',
      insurance_flag: payload.isInsurance ? 'Y' : 'N',
      special_ins: '',
      merchant_id: this.sellerData.id,
      type: 'PICKUP',
      cod_flag: (payload.isCod) ? 'YES' : 'NO',
      cod_amount: payload.goodsAmount || '',
      awb: `${process.env.JNE_ORDER_PREFIX}${shortid.generate()}`,
    };
  }
};
