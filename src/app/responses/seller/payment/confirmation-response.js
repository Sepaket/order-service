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
      const {
        PAID,
        FAILED,
        EXPIRED,
        PENDING,
      } = paymentStatus;

      const { body } = this.request;
      const credit = await this.credit.findOne({
        where: { externalId: body.external_id },
      });

      if (!credit) {
        throw new Error('Invalid Data (external_id)');
      }

      if (credit.status !== PENDING.text) {
        throw new Error('This id has been processed');
      }

      const seller = await this.sellerDetail.findOne({
        where: { sellerId: credit?.sellerId },
      });

      let { status } = body;
      if (body.status === 'PAID') status = PAID.text;
      if (body.status === 'EXPIRED') status = EXPIRED.text;
      if (body.status === 'FAILED') status = FAILED.text;

      await this.credit.update(
        { status, payloadResponse: JSON.stringify(body) },
        { where: { id: credit?.id } },
        { transaction: dbTransaction },
      );

      if (['PAID', 'COMPLETED'].includes(body.status)) {
        if (credit.withdraw && credit.withdraw !== null) {
          await this.sellerDetail.update(
            { credit: parseFloat(seller?.credit || 0) - parseFloat(body.amount) },
            { where: { sellerId: credit?.sellerId } },
            { transaction: dbTransaction },
          );
        }

        if (credit.topup && credit.topup !== null) {
          await this.sellerDetail.update(
            { credit: parseFloat(seller?.credit || 0) + parseFloat(body.amount) },
            { where: { sellerId: credit?.sellerId } },
            { transaction: dbTransaction },
          );
        }
      }

      await dbTransaction.commit();
      return body.status === 'PAID';
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
