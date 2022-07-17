const shortid = require('shortid-36');
const ninja = require('../../../../../helpers/ninja');
const jwtSelector = require('../../../../../helpers/jwt-selector');
const orderStatus = require('../../../../../constant/order-status');
const snakeCaseConverter = require('../../../../../helpers/snakecase-converter');
const { formatCurrency } = require('../../../../../helpers/currency-converter');
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

          const resi = `${process.env.NINJA_ORDER_PREFIX}${shortid.generate()}`;
          const origin = this.sellerAddress.location;
          const destination = await this.location.findOne({
            where: { id: item.receiver_location_id },
          });

          const ninjaCondition = (origin.ninjaOriginCode !== '' && destination.ninjaDestinationCode !== '');
          const shippingFee = !process.env.NINJA_BASE_URL?.includes('sandbox')
            ? await this.shippingFee({ origin, destination, weight: item.weight })
            : 1;

          const payload = {
            resi,
            origin,
            destination,
            shippingFee,
            ...item,
            ...body,
          };

          const parameter = await this.paramsMapper(payload);
          const codCondition = (item.is_cod)
            ? (this.codValidator({ payload }))
            : true;

          if (!ninjaCondition) throw new Error(`Origin or destination code for ${body.type} not setting up yet!`);
          if (shippingFee && codCondition) {
            await this.ninja.createOrder(parameter);
            const orderId = await this.insertLog({ ...payload });
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

      // make shipping fee conditional bcs ninja has no sandbox for check price
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
      const price = await this.ninja.checkPrice({
        origin: origin.ninjaOriginCode,
        destination: destination.ninjaDestinationCode,
        service: body.service_code,
        weight,
      });

      return price;
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

  async paramsMapper(payload) {
    const { body } = this.request;

    return {
      requested_tracking_number: payload.resi,
      service_type: 'Parcel',
      service_level: body.service_code,
      from: {
        name: payload.sender_name,
        phone_number: payload.sender_phone,
        email: this.sellerData.email,
        address: {
          address1: this.sellerAddress?.address || '',
          address2: '',
          area: payload.origin?.subDistrict || '',
          city: payload.origin?.city || '',
          state: payload.origin?.province || '',
          address_type: 'office',
          country: 'Indonesia',
          postcode: payload.origin?.postalCode || '',
        },
      },
      to: {
        name: payload.receiver_name,
        phone_number: payload.receiver_phone,
        email: '',
        address: {
          address1: `${payload.receiver_address}, Note: ${payload.receiver_address_note}`,
          address2: '',
          area: payload.destination?.subDistrict || '',
          city: payload.destination?.city || '',
          state: payload.destination?.province || '',
          address_type: 'home',
          country: 'Indonesia',
          postcode: payload.destination?.postalCode || '',
        },
      },
      parcel_job: {
        is_pickup_required: true,
        pickup_service_type: 'Scheduled',
        pickup_service_level: payload.service_code,
        pickup_date: payload.pickup_date,
        pickup_timeslot: {
          start_time: '09:00',
          end_time: '18:00',
          timezone: 'Asia/Jakarta',
        },
        pickup_instructions: payload.note,
        delivery_start_date: payload.pickup_date,
        delivery_timeslot: {
          start_time: '09:00',
          end_time: '18:00',
          timezone: 'Asia/Jakarta',
        },
        delivery_instructions: payload.note,
        'allow-weekend_delivery': true,
        dimensions: {
          weight: payload.weight,
        },
        items: [
          {
            item_description: payload.goods_content,
            quantity: payload.goods_qty,
            is_dangerous_good: payload.goods_category === 'ORGANIC',
          },
        ],
      },
    };
  }
};
