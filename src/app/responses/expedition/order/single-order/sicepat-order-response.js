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

      this.resi = `${process.env.SICEPAT_CUSTOMER_ID}${randomNumber({ integer: true, max: 99999, min: 10000 })}`;
      this.origin = this.sellerAddress.location;
      this.destination = await this.location.findOne({ where: { id: body.receiver_location_id } });
      this.shippingFee = await this.shippingFee();

      const parameter = await this.paramsMapper();
      const sicepatCondition = (this.origin.sicepatOriginCode !== '' && this.destination.sicepatDestinationCode !== '');

      if (!sicepatCondition) throw new Error(`Origin or destination code for ${body.type} not setting up yet!`);
      if (!this.shippingFee) throw new Error('Service for this destination not found!');

      const order = await this.sicepat.createOrder(parameter);
      const orderId = await this.insertLog(order);

      return {
        order_id: orderId,
        resi: order?.length > 0 ? order[0].receipt_number : '',
      };
    } catch (error) {
      if (error?.message?.includes('SICEPAT:')) {
        throw new Error(`${error?.message}, Please try again later`);
      }

      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async shippingFee() {
    try {
      const { body } = this.request;
      const prices = await this.sicepat.checkPrice({
        origin: this.origin.sicepatOriginCode,
        destination: this.destination.sicepatDestinationCode,
        weight: body.weight,
      });

      const service = await prices?.find((item) => item.service === body.service_code);

      return service?.tariff;
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

  async orderQuery(order) {
    const { body } = this.request;

    return {
      resi: order?.length > 0 ? order[0].receipt_number : '',
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

  async receiverAddress() {
    const { body } = this.request;
    const address = this.destination;

    return `
      ${body?.address || ''},
      Kec. ${address?.subDistrict || ''},
      Kota ${address?.city || ''},
      ${address?.province || ''},
      ${address?.postalCode || ''}
    `;
  }

  async paramsMapper() {
    const { body } = this.request;
    const pickupAddress = await this.pickupAddress();
    const receiverAddress = await this.receiverAddress();

    return {
      reference_number: `${process.env.SICEPAT_ORDER_PREFIX}${this.resi}`,
      pickup_request_date: `${body.pickup_date} ${body.pickup_time}`,
      pickup_method: 'PICKUP',
      pickup_merchant_code: `Sepaket-${this.sellerData.id}`,
      pickup_merchant_name: this.sellerAddress.picName,
      pickup_address: pickupAddress.replace(/\n/g, ' ').replace(/  +/g, ' '),
      pickup_city: this.sellerAddress?.location?.city?.toUpperCase() || '',
      pickup_merchant_phone: this.sellerAddress?.picPhoneNumber || '',
      pickup_merchant_email: this.sellerData?.email || '',
      PackageList: [
        {
          receipt_number: this.resi,
          origin_code: this.origin.sicepatOriginCode,
          delivery_type: body.service_code,
          parcel_category: body.goods_category,
          parcel_content: body.goods_content,
          parcel_qty: body.goods_qty,
          parcel_uom: 'Pcs',
          parcel_value: body.goods_amount,
          total_weight: body.weight,
          shipper_name: body.sender_name,
          shipper_address: pickupAddress.replace(/\n/g, ' ').replace(/  +/g, ' '),
          shipper_province: this.sellerAddress?.location?.province || '',
          shipper_city: this.sellerAddress?.location?.city || '',
          shipper_district: this.sellerAddress?.location?.district || '',
          shipper_zip: this.sellerAddress?.location?.postalCode || '',
          shipper_phone: body.sender_phone,
          shipper_longitude: '',
          shipper_latitude: '',
          recipient_title: 'Mr',
          recipient_name: body.receiver_name,
          recipient_address: receiverAddress.replace(/\n/g, ' ').replace(/  +/g, ' '),
          recipient_province: this.destination.province,
          recipient_city: this.destination.city,
          recipient_district: this.destination.district,
          recipient_zip: this.destination.postalCode,
          recipient_phone: body.receiver_phone,
          recipient_longitude: '',
          recipient_latitude: '',
          destination_code: this.destination.sicepatDestinationCode,
        },
      ],
    };
  }
};
