const { Sequelize } = require('sequelize');
const excelReader = require('read-excel-file/node');
const ninja = require('../../../../../helpers/ninja');
const jwtSelector = require('../../../../../helpers/jwt-selector');
const { formatCurrency } = require('../../../../../helpers/currency-converter');
const orderStatus = require('../../../../../constant/order-status');
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
    this.ninja = ninja;
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
        dataOrders?.map(async (item, index) => {
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
              goodsAmount: item[9],
              goodsContent: item[10],
              goodsQty: item[11],
              isInsurance: item[12],
              note: item[13],
              isCod: !!((item[9] && item[9] !== '' && item[9] !== 0) || item[9] !== null),
            };

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

            const origin = this.sellerAddress.location;
            const destination = locations?.find((location) => location.postalCode === `${excelData.receiverAddressPostalCode}`);
            const shippingFee = await this.shippingFee({
              origin,
              destination,
              weight: excelData.weight,
            });

            result.push({
              error: !shippingFee ? 'Service for this destination not found' : '',
              receiver_name: excelData?.receiverName || '',
              receiver_phone: excelData?.receiverPhone || '',
              receiver_location: {
                id: destination?.id || 0,
                province: destination?.province || '',
                city: destination?.city || '',
                district: destination?.district || '',
                sub_district: destination?.subDistrict || '',
                postal_code: destination?.postalCode || '',
              },
              receiver_address: excelData?.receiverAddress || '',
              receiver_address_note: excelData?.receiverAddressNote || '',
              is_cod: excelData?.isCod,
              weight: excelData?.weight || 1,
              goods_amount: excelData?.goodsAmount || 0,
              goods_content: excelData?.goodsContent || '',
              goods_qty: excelData?.goodsQty || 1,
              note: excelData?.note || '',
              is_insurance: excelData?.isInsurance,
              shipping_fee: {
                raw: shippingFee || 0,
                formatted: formatCurrency(shippingFee || 0, 'Rp.'),
              },
            });
          }

          return item;
        }) || [],
      );

      return result;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
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
      resi: payload.resi,
      expedition: payload.type,
      serviceCode: payload.service_code,
      isCod: payload.isCod,
      orderDate: payload.pickup_date,
      orderTime: payload.pickup_time,
      totalAmount: parseFloat(payload.goodsAmount) + parseFloat(payload.shippingFee),
      status: orderStatus.WAITING_PICKUP.text,
    };
  }

  async orderQueryDetail(payload) {
    return {
      sellerId: this.sellerData?.id,
      sellerAddressId: this.sellerAddress?.id,
      weight: payload.weight,
      totalItem: payload.goodsQty,
      notes: payload.notes,
      goodsContent: payload.goodsContent,
      goodsPrice: payload.goodsAmount,
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
      receiverLocationId: payload.destination?.id,
    };
  }

  async paramsMapper({ payload }) {
    const { body } = this.request;

    return {
      requested_tracking_number: payload.resi,
      service_type: 'Parcel',
      service_level: body.service_code,
      from: {
        name: payload.sender_name || this.sellerData.name,
        phone_number: payload.sender_phone || this.sellerData.phone,
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
        name: payload.receiverName,
        phone_number: payload.receiverPhone,
        email: '',
        address: {
          address1: `${payload.receiverAddress}, Note: ${payload.receiverAddressNote}`,
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
            item_description: payload.goodsContent,
            quantity: payload.goodsQty,
            is_dangerous_good: false,
          },
        ],
      },
    };
  }
};
