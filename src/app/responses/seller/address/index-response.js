const httpErrors = require('http-errors');
const snakecaseKeys = require('snakecase-keys');
const { Op } = require('sequelize');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { SellerAddress } = require('../../../models');
const auth = require('../../../../helpers/auth');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.converter = snakeCaseConverter;
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
    const q = {};
    let result = null;
    q.where = {
      seller_id: sellerId,
    };

    // eslint-disable-next-line no-console
    q.logging = console.log;

    if (this.request.query.q) {
      q.where[Op.or] = [
        {
          name: { [Op.like]: `%${this.request.query.q}%` },
        },
        {
          picName: { [Op.like]: `%${this.request.query.q}%` },
        },
        {
          picPhoneNumber: { [Op.like]: `%${this.request.query.q}%` },
        },
        {
          address: { [Op.like]: `%${this.request.query.q}%` },
        },
        {
          addressDetail: { [Op.like]: `%${this.request.query.q}%` },
        },
      ];
    }

    if (this.request.query?.pagination === '1') {
      q.limit = Number(this.request.query.limit) || 10;
      q.offset = this.request.query.page ? (this.request.query.page - 1) * q.limit : 0;

      const { count, rows } = await SellerAddress.findAndCountAll(q);
      return snakecaseKeys(JSON.parse(JSON.stringify({
        count,
        per_page: q.limit,
        current_page: q.offset + 1,
        data: rows,
      })));
    }

    const data = await SellerAddress.findAll(q);

    if (data) {
      result = snakecaseKeys(JSON.parse(JSON.stringify(data)));
    }

    return result;
  }
};
