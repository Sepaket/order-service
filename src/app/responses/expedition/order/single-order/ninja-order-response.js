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
      this.destination = await this.location.findOne({ where: { id: body.receiver_location_id } });
      this.shippingFee = await this.shippingFee();

      const parameter = await this.paramsMapper();
      const jneCondition = (this.origin.sicepatOriginCode !== '' && this.destination.sicepatDestinationCode !== '');

      if (!jneCondition) throw new Error(`Origin or destination code for ${body.type} not setting up yet!`);
      if (!this.shippingFee) throw new Error('Service for this destination not found!');

      const order = await this.ninja.createOrder(parameter);
      const orderId = await this.insertLog(order);

      return {
        order_id: orderId,
        resi: order?.length > 0 ? order[0].receipt_number : '',
      };
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async shippingFee() {
    try {
      const { body } = this.request;
      const price = await this.ninja.checkPrice({
        origin: this.origin.sicepatOriginCode,
        destination: this.destination.sicepatDestinationCode,
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
    // const pickupAddress = await this.pickupAddress();
    // const receiverAddress = await this.receiverAddress();

    return {
      requested_tracking_number: '1234-56789',
      tracking_number: 'PREFIX1234-56789',
      service_type: 'Parcel',
      service_level: body.service_code,
      reference: {
        merchant_order_number: 'SHIP-1234-56789',
      },
      from: {
        name: 'John Doe',
        phone_number: '+60138201527',
        email: 'john.doe@gmail.com',
        address: {
          address1: '17 Lorong Jambu 3',
          address2: '',
          area: 'Taman Sri Delima',
          city: 'Simpang Ampat',
          state: 'Pulau Pinang',
          address_type: 'office',
          country: 'MY',
          postcode: '51200',
        },
      },
      to: {
        name: 'Jane Doe',
        phone_number: '+60103067174',
        email: 'jane.doe@gmail.com',
        address: {
          address1: 'Jalan PJU 8/8',
          address2: '',
          area: 'Damansara Perdana',
          city: 'Petaling Jaya',
          state: 'Selangor',
          address_type: 'home',
          country: 'MY',
          postcode: '47820',
        },
      },
      parcel_job: {
        is_pickup_required: true,
        pickup_service_type: 'Scheduled',
        pickup_service_level: 'Standard',
        pickup_address_id: '98989012',
        pickup_date: '2021-12-15',
        pickup_timeslot: {
          start_time: '09:00',
          end_time: '12:00',
          timezone: 'Asia/Kuala_Lumpur',
        },
        pickup_approximate_volume: 'Less than 3 Parcels',
        pickup_instructions: 'Pickup with care!',
        delivery_start_date: '2021-12-16',
        delivery_timeslot: {
          start_time: '09:00',
          end_time: '12:00',
          timezone: 'Asia/Kuala_Lumpur',
        },
        delivery_instructions: 'If recipient is not around, leave parcel in power riser.',
        'allow-weekend_delivery': true,
        dimensions: {
          weight: 1.5,
        },
        items: [
          {
            item_description: 'Sample description',
            quantity: 1,
            is_dangerous_good: false,
          },
        ],
      },
    };
  }
};
