const httpErrors = require('http-errors');
const { SellerDetail, sequelize } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.sellerDetail = SellerDetail;
    return this.process();
  }

  async process() {
    const dbTransaction = await sequelize.transaction();

    try {
      this.seller = await jwtSelector({ request: this.request });
      const parameterMapper = await this.mapper();

      await this.address.create(
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
    const { body } = this.request;

    return {
      sellerId: this.seller.id,
      name: body.name,
      picName: body.pic_name,
      picPhoneNumber: body.pic_phone,
      address: body.address,
      locationId: body.location_id,
      active: true,
    };
  }
};
