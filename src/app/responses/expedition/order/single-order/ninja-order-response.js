const shortid = require('shortid-36');
const ninja = require('../../../../../helpers/ninja');
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
    this.ninja = ninja;
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

      this.origin = this.sellerAddress.location;
      this.resi = `${process.env.NINJA_ORDER_PREFIX}${shortid.generate()}`;
      this.destination = await this.location.findOne({ where: { id: body.receiver_location_id } });
      this.shippingFee = !process.env.NINJA_BASE_URL?.includes('sandbox') ? await this.shippingFee() : 1;
      // make shipping fee conditional bcs ninja has no sandbox for check price

      const parameter = await this.paramsMapper();
      const ninjaCondition = (this.origin.ninjaOriginCode !== '' && this.destination.ninjaDestinationCode !== '');

      if (!ninjaCondition) throw new Error(`Origin or destination code for ${body.type} not setting up yet!`);
      if (!this.shippingFee) throw new Error('Service for this destination not found!');

      await this.ninja.createOrder(parameter);
      const orderId = await this.insertLog();

      return {
        order_id: orderId,
        resi: this.resi,
      };
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async shippingFee() {
    try {
      const { body } = this.request;
      const price = await this.ninja.checkPrice({
        origin: this.origin.ninjaOriginCode,
        destination: this.destination.ninjaDestinationCode,
        weight: body.weight,
        service: body.service_code,
      });

      return price;
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

  async orderQuery() {
    const { body } = this.request;

    return {
      resi: this.resi,
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
      requested_tracking_number: this.resi,
      service_type: 'Parcel',
      service_level: body.service_code,
      from: {
        name: body.sender_name,
        phone_number: body.sender_phone,
        email: this.sellerData.email,
        address: {
          address1: this.sellerAddress?.address || '',
          address2: '',
          area: this.origin?.subDistrict || '',
          city: this.origin?.city || '',
          state: this.origin?.province || '',
          address_type: 'office',
          country: 'Indonesia',
          postcode: this.origin?.postalCode || '',
        },
      },
      to: {
        name: body.receiver_name,
        phone_number: body.receiver_phone,
        email: '',
        address: {
          address1: `${body.receiver_address}, Note: ${body.receiver_address_note}`,
          address2: '',
          area: this.destination?.subDistrict || '',
          city: this.destination?.city || '',
          state: this.destination?.province || '',
          address_type: 'home',
          country: 'Indonesia',
          postcode: this.destination?.postalCode || '',
        },
      },
      parcel_job: {
        is_pickup_required: true,
        pickup_service_type: 'Scheduled',
        pickup_service_level: body.service_code,
        pickup_date: body.pickup_date,
        pickup_timeslot: {
          start_time: '09:00',
          end_time: '18:00',
          timezone: 'Asia/Jakarta',
        },
        pickup_instructions: body.note,
        delivery_start_date: body.pickup_date,
        delivery_timeslot: {
          start_time: '09:00',
          end_time: '18:00',
          timezone: 'Asia/Jakarta',
        },
        delivery_instructions: body.note,
        'allow-weekend_delivery': true,
        dimensions: {
          weight: body.weight,
        },
        items: [
          {
            item_description: body.goods_content,
            quantity: body.goods_qty,
            is_dangerous_good: body.goods_category === 'ORGANIC',
          },
        ],
      },
    };
  }
};
