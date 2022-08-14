const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { SellerDetail, sequelize } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.sellerDetail = SellerDetail;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const { body } = this.request;
    const dbTransaction = await sequelize.transaction();

    try {
      await this.sellerDetail.update(
        {
          codFee: null,
          codFeeType: null,
          discount: null,
          discountType: null,
          rateReferal: null,
          rateReferalType: null,
        },
        {
          where: { sellerId: body.seller_id },
          transaction: dbTransaction,
        },
      );

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
