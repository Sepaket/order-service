const { Sequelize } = require('sequelize');
const excelReader = require('read-excel-file/node');
const sicepat = require('../../../../../helpers/sicepat');
const jwtSelector = require('../../../../../helpers/jwt-selector');
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
              isCod: !!((item[9] || item[9] !== '' || item[9] !== 0)),
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
};
