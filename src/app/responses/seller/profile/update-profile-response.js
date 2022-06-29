const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Seller, SellerDetail, sequelize } = require('../../../models');
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
    return new Promise(async (resolve, reject) => {
      const dbTransaction = await sequelize.transaction();

      try {
        const { headers, body } = this.request;

        const parameterMapper = this.parameterMapper();
        const authorizationHeader = headers.authorization;
        const token = authorizationHeader
          .replace(/bearer/gi, '')
          .replace(/ /g, '');

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        this.userId = decoded.id;
        this.token = token;

        if (await this.checkEmail()) {
          reject(httpErrors(422, 'This email has been exist, try another email', { data: false }));
          return;
        }

        await this.seller.update(
          { ...parameterMapper },
          { where: { id: decoded.id } },
          { transaction: dbTransaction },
        );

        await this.sellerDetail.update(
          { photo: body.photo },
          { where: { sellerId: decoded.id } },
          { transaction: dbTransaction },
        );

        await dbTransaction.commit();

        this.updateRedisToken();
        resolve(true);
      } catch (error) {
        await dbTransaction.rollback();
        reject(error);
      }
    });
  }

  async checkEmail() {
    try {
      const { body } = this.request;

      const seller = await this.seller.findOne({
        where: {
          id: { [this.op.not]: this.userId },
          email: { [this.op.eq]: body.email },
        },
      });

      return seller;
    } catch (error) {
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
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
