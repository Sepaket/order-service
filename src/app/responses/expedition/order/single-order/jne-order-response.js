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

        resolve({
          data: result,
          meta: null,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async createOrder() {
    try {
      const { body } = this.request;
      const sellerId = await jwtSelector({ request: this.request });
      const origin = await this.location.findOne({ where: { id: body.origin } });
      const destination = await this.location.findOne({ where: { id: body.destination } });
      const jneCondition = (origin.jneOriginCode !== '' && destination.jneDestinationCode !== '');

      this.parameter = await this.paramsMapper();
      this.sellerData = await this.seller.findOne({ where: { id: sellerId.id } });
      this.sellerAddress = await this.address.findOne({
        where: { id: body.origin, sellerId: sellerId.id },
      });

      if (!this.sellerAddress) throw new Error('Invalid seller address id (Seller Address)');
      if (!jneCondition) throw new Error('Origin or destination code for JNE not setting up yet!');

      const paramFormatted = await this.caseConverter();
      const order = await this.jne.createOrder(paramFormatted);

      return order;
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
      pickup_date: body.pickup_date,
      pickup_time: body.pickup_time,
      pickup_pic: this.seller
    };
  }
};
