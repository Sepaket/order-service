const httpErrors = require('http-errors');
const { getRedisData, deleteRedisData } = require('../../../../helpers/redis');
const { Seller } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.request = request;
    return this.process();
  }

  async process() {
    const { params, query } = this.request;
    const redisToken = await getRedisData({ db: 1, key: `email-token-${query.email}` });

    return new Promise((resolve, reject) => {
      const match = (redisToken === params.token);

      if (!match) {
        reject(httpErrors(400, 'Token not match!'));
        return;
      }

      if (!redisToken) {
        reject(httpErrors(400, 'Token has expired'));
        return;
      }

      deleteRedisData({ db: 1, key: `email-token-${query.email}` });

      this.seller.update(
        { isVerified: true },
        { where: { email: query.email } },
      )
        .then(() => resolve(true))
        .catch((error) => reject(error));
    });
  }
};
