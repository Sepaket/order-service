const { Sequelize } = require('sequelize');
const excelReader = require('read-excel-file/node');
const sicepat = require('../../../../../helpers/sicepat');
const jwtSelector = require('../../../../../helpers/jwt-selector');
const orderStatus = require('../../../../../constant/order-status');
const { formatCurrency } = require('../../../../../helpers/currency-converter');
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
    this.sicepat = sicepat;
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

            let errorMessage = '';
            const origin = this.sellerAddress.location;
            const destination = locations?.find((location) => location.postalCode === `${excelData.receiverAddressPostalCode}`);
            const shippingFee = await this.shippingFee({
              origin,
              destination,
              weight: excelData.weight,
            });

            if (!shippingFee) errorMessage = 'Service for this destination not found';
            if (!destination) errorMessage = 'Sorry! Your district or postal code may wrong';

            result.push({
              error: errorMessage,
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
      ${payload?.receiverAddress || ''},
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
          parcel_category: 'Normal',
          parcel_content: payload.goodsContent,
          parcel_qty: payload.goodsQty,
          parcel_uom: 'Pcs',
          parcel_value: payload.goodsAmount,
          total_weight: payload.weight,
          shipper_name: payload.sender_name || this.sellerAddress.picName,
          shipper_address: pickupAddress.replace(/\n/g, ' ').replace(/  +/g, ' '),
          shipper_province: this.sellerAddress?.location?.province || '',
          shipper_city: this.sellerAddress?.location?.city || '',
          shipper_district: this.sellerAddress?.location?.district || '',
          shipper_zip: this.sellerAddress?.location?.postalCode || '',
          shipper_phone: payload.sender_phone || this.sellerAddress?.picPhoneNumber,
          shipper_longitude: '',
          shipper_latitude: '',
          recipient_title: 'Mr',
          recipient_name: payload.receiverName,
          recipient_address: receiverAddress.replace(/\n/g, ' ').replace(/  +/g, ' '),
          recipient_province: payload.destination.province,
          recipient_city: payload.destination.city,
          recipient_district: payload.destination.district,
          recipient_zip: payload.destination.postalCode,
          recipient_phone: payload.receiverPhone,
          recipient_longitude: '',
          recipient_latitude: '',
          destination_code: payload.destination.sicepatDestinationCode,
        },
      ],
    };
  }
};
