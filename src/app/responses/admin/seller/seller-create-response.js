const httpErrors = require('http-errors');
const { Seller, SellerDetail, sequelize } = require('../../../models');
const hash = require('../../../../helpers/hash');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.sellerDetail = SellerDetail;
    this.request = request;
    return this.process();
  }

  async process() {
    const dbTransaction = await sequelize.transaction();

    try {
      const parameterMapper = await this.mapper();

      const seller = await this.seller.create(
        { ...parameterMapper },
        { transaction: dbTransaction },
      );

      await this.sellerDetail.create(
        { sellerId: seller.id },
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }

  async mapper() {
    const { body } = this.request;

    return {
      name: body.username,
      email: body.email,
      password: await hash({ payload: body.password }),
      phone: -1,
      isNew: true,
      isVerified: true,
    };
  }
};
