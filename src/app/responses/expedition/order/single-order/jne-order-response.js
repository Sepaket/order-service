const moment = require('moment');
const shortid = require('shortid-36');
const jne = require('../../../../../helpers/jne');
const { Location, Seller, SellerAddress } = require('../../../../models');
const snakeCaseConverter = require('../../../../../helpers/snakecase-converter');
const jwtSelector = require('../../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.jne = jne;
    this.seller = Seller;
    this.request = request;
    this.location = Location;
    this.address = SellerAddress;
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
      this.parameter = await this.paramsMapper();
      const jneCondition = (this.origin.jneOriginCode !== '' && this.destination.jneDestinationCode !== '');
      if (!jneCondition) throw new Error('Origin or destination code for JNE not setting up yet!');

      const paramFormatted = await this.caseConverter();
      const order = await this.jne.createOrder(paramFormatted);

      return {
        resi: order?.shift()?.cnote_no || ''
      };
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async caseConverter() {
    return Object.keys(this.parameter).reduce((accumulator, key) => {
      accumulator[key.toUpperCase()] = this.parameter[key];
      return accumulator;
    }, {});
  }

  async paramsMapper() {
    const { body } = this.request;

    return {
      pickup_name: this.sellerData?.name || '',
      pickup_date: body.pickup_date.split('-').reverse().join('-'),
      pickup_time: body.pickup_time,
      pickup_pic: this.sellerAddress?.picName || '',
      pickup_pic_phone: this.sellerAddress?.picPhoneNumber || '',
      pickup_address: this.sellerAddress?.address || '',
      pickup_district: this.origin?.district || '',
      pickup_city: this.origin?.city || '',
      pickup_service: 'Domestic',
      pickup_vechile: body.should_pickup_with,
      branch: this.origin?.jneOriginCode || '',
      cust_id: body.is_cod ? process.env.JNE_CUSTOMER_COD : process.env.JNE_CUSTOMER_NCOD,
      order_id: `${shortid.generate()}${moment().format('YYMDHHmmss')}`,
      shipper_name: body.sender_name || '',
      shipper_addr1: this.sellerAddress?.address?.slice(0, 80) || '',
      shipper_city: this.origin?.city || '',
      shipper_zip: this.origin?.postalCode || '',
      shipper_region: this.origin?.province || '',
      shipper_country: 'INDONESIA',
      shipper_contact: body.sender_name,
      shipper_phone: this.sellerAddress?.picPhoneNumber || '',
      receiver_name: body.receiver_name,
      receiver_addr1: body.receiver_address,
      receiver_city: this.destination?.city || '',
      receiver_zip: this.destination?.postalCode || '',
      receiver_region: this.destination?.province || '',
      receiver_country: 'INDONESIA',
      receiver_contact: body.receiver_name,
      receiver_phone: body.receiver_phone,
      origin_code: this.origin?.jneOriginCode || '',
      destination_code: this.destination?.jneDestinationCode || '',
      service_code: body.service_code,
      weight: body.weight,
      qty: body.goods_qty,
      goods_desc: body.notes,
      goods_amount: body.goods_amount,
      insurance_flag: body.is_insurance ? 'Y' : 'N',
      special_ins: '',
      merchant_id: this.sellerData.id,
      type: 'PICKUP',
      cod_flag: body.is_cod ? 'YES' : 'NO',
      cod_amount: body?.goods_amount,
      awb: `${process.env.JNE_ORDER_PREFIX}${shortid.generate()}`,
    };
  }
};
