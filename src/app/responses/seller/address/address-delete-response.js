const { SellerAddress } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.address = SellerAddress;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        this.seller = await jwtSelector({ request: this.request });
        const { params } = this.request;

        const selectedAddress = await this.address.findOne({ where: { id: params.id } });
        await selectedAddress.destroy();

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }
};
