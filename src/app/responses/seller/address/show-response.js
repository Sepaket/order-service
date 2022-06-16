const httpErrors = require('http-errors');
const snakecaseKeys = require('snakecase-keys');
const { SellerAddress } = require('../../../models');
const auth = require('../../../../helpers/auth');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    return this.process();
  }

  process() {
    return new Promise((resolve, reject) => {
      let result = null;
      result = this.getData();

      if (result) resolve(result);

      reject(httpErrors(404, 'No Data Found', { data: null }));
    });
  }

  async getData() {
    const sellerId = auth.sellerId(this.request);

    let result = null;
    const data = await SellerAddress.findOne({
      where: {
        id: this.request.query.id,
        sellerId,
      },
    });

    if (data) {
      result = snakecaseKeys(JSON.parse(JSON.stringify(data)));
    }

    return result;
  }
};
