const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { SellerDetail, CreditHistory, sequelize } = require('../../../models');
const { paymentStatus } = require('../../../../constant/status');

module.exports = class {
  constructor({ request }) {
    this.sellerDetail = SellerDetail;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const { body } = this.request;
    const { PAID } = paymentStatus;
    const dbTransaction = await sequelize.transaction();

    try {
      await this.sellerDetail.update(
        { credit: sequelize.literal(`coalesce(credit,0) + ${body.amount}`) },
        {
          where: { sellerId: body.seller_id },
          transaction: dbTransaction,
        },
      );

      await CreditHistory.create(
        {
          externalId: 'ADMIN-TOPUP',
          provider: 'ADMIN',
          sellerId: body.seller_id,
          topup: parseFloat(body.amount),
          status: PAID.text,
        },
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
