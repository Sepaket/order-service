const httpErrors = require('http-errors');
const { SellerDetail, CreditHistory, sequelize } = require('../../../models');
const { paymentStatus } = require('../../../../constant/status');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.credit = CreditHistory;
    this.sellerDetail = SellerDetail;
    return this.process();
  }

  async process() {
    const dbTransaction = await sequelize.transaction();

    try {
      const { PAID, FAILED, EXPIRED } = paymentStatus;
      const { body } = this.request;
      const credit = await this.credit.findOne({
        where: { externalId: body.external_id },
      });

      const currentCredit = await this.sellerDetail.findOne({
        where: { sellerId: credit.sellerId },
      });

      let { status } = body;
      if (body.status === 'PAID') status = PAID.text;
      if (body.status === 'EXPIRED') status = EXPIRED.text;
      if (body.status === 'FAILED') status = FAILED.text;

      await this.credit.update(
        { status },
        { where: { id: credit?.id } },
        { transaction: dbTransaction },
      );

      if (body.status === 'PAID') {
        await this.sellerDetail.update(
          { credit: parseFloat(currentCredit) + parseFloat(body.amount) },
          { where: { sellerId: credit.sellerId } },
          { transaction: dbTransaction },
        );
      }

      await dbTransaction.commit();
      return body.status === 'PAID';
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
