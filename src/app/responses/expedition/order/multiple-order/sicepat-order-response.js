const randomNumber = require('random-number');
const sicepat = require('../../../../../helpers/sicepat');
const jwtSelector = require('../../../../../helpers/jwt-selector');
const { orderStatus } = require('../../../../../constant/status');
const snakeCaseConverter = require('../../../../../helpers/snakecase-converter');
const {
  Location,
  Seller,
  Order,
  OrderLog,
  OrderFailed,
  OrderDetail,
  OrderAddress,
  SellerAddress,
  sequelize,
} = require('../../../../models');

module.exports = class {
  constructor({ request }) {
    this.sicepat = sicepat;
    this.order = Order;
    this.seller = Seller;
    this.request = request;
    this.location = Location;
    this.orderLog = OrderLog;
    this.address = SellerAddress;
    this.orderFailed = OrderFailed;
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
              error: 'Service for this destination not found',
              payload: item,
            },
          ];

          const resi = `${process.env.SICEPAT_CUSTOMER_ID}${randomNumber({ integer: true, max: 99999, min: 10000 })}`;
          const origin = this.sellerAddress.location;
          const destination = await this.location.findOne({
            where: { id: item.receiver_location_id },
          });

          const shippingFee = await this.shippingFee({ origin, destination, weight: item.weight });
          const sicepatCondition = (origin.sicepatOriginCode !== '' && destination.sicepatDestinationCode !== '');

          const payload = {
            resi,
            origin,
            destination,
            shippingFee,
            ...item,
            ...body,
          };

          const parameter = await this.paramsMapper({ payload });

          if (!this.codValidator({ payload })) throw new Error('This service code does not exist when you choose COD');
          if (!sicepatCondition) throw new Error(`Origin or destination code for ${body.type} not setting up yet!`);
          if (shippingFee) {
            const order = await this.sicepat.createOrder(parameter);
            const responseResi = order?.length > 0 ? order[0].receipt_number : '';
            const orderId = await this.insertLog({ ...payload, resi: responseResi });

            result = [{ order_id: orderId, resi: responseResi }];
          }

          return result?.shift();
        }),
      );

      return response;
    } catch (error) {
      if (error?.message?.includes('SICEPAT:')) {
        throw new Error(`${error?.message}, Please try again later`);
      }

      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async codValidator({ payload }) {
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

  async orderQuery(payload) {
    // eslint-disable-next-line no-unused-vars
    const { body } = this.request;

    return {
      resi: payload.resi,
      expedition: payload.type,
      serviceCode: payload.service_code,
      isCod: payload.is_cod,
      orderDate: payload.pickup_date,
      orderTime: payload.pickup_time,
      totalAmount: parseFloat(payload.goods_amount) + parseFloat(payload.shippingFee),
      status: orderStatus.WAITING_PICKUP,
    };
  }

  async orderQueryDetail(payload) {
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
          parcel_value: payload.goods_amount,
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
