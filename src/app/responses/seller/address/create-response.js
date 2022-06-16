const httpErrors = require('http-errors');
const { SellerAddress, sequelize } = require('../../../models');
const auth = require('../../../../helpers/auth');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    return this.process();
  }

  async process() {
    const dbTransaction = await sequelize.transaction();

    try {
      const parameterMapper = await this.mapper();

      await SellerAddress.create(
        { ...parameterMapper },
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
    const sellerId = auth.sellerId(this.request);
    const { body } = this.request;

    return {
      sellerId,
      name: body.name,
      picName: body.pic_name,
      picPhoneNumber: body.pic_phone,
      address: body.address,
      addressDetail: body.address_detail,
      active: true,
    };
  }
};
