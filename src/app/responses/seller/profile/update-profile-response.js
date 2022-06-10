const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Seller, SellerDetail } = require('../../../models');
const { setRedisData } = require('../../../../helpers/redis');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.sellerDetail = SellerDetail;
    this.op = Sequelize.Op;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise((resolve, reject) => {
      const { headers, body } = this.request;

      const parameterMapper = this.parameterMapper();
      const authorizationHeader = headers.authorization;
      const token = authorizationHeader
        .replace(/bearer/gi, '')
        .replace(/ /g, '');

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      this.userId = decoded.id;
      this.token = token;

      if (body.email !== '') this.checkEmail(resolve, reject);

      this.seller.update(
        { ...parameterMapper },
        { where: { id: decoded.id } },
      ).then(() => {
        this.updateRedisToken();
        resolve(true);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  checkEmail(resolve, reject) {
    const { body } = this.request;
    this.seller.findOne({
      where: {
        id: {
          [this.op.not]: this.userId,
        },
        email: {
          [this.op.eq]: body.email,
        },
      },
    }).then((result) => {
      if (!result) return resolve(true);
      return reject(httpErrors(422, 'This email has been exist, try another email', { data: false }));
    }).catch((error) => reject(error));
  }

  updateRedisToken() {
    const { body } = this.request;

    setRedisData({
      db: 0,
      key: `token-${body.email}`,
      timeout: 86400000,
      data: this.token,
    });
  }

  parameterMapper() {
    const { body } = this.request;

    return {
      name: body.name,
      email: body.email,
      phone: body.phone,
    };
  }
};
