const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Seller, SellerDetail, sequelize } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.sellerDetail = SellerDetail;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const { params } = this.request;
    const dbTransaction = await sequelize.transaction();

    try {
      await this.seller.destroy({
        where: { id: params.id },
      }, { transaction: dbTransaction });

      await this.sellerDetail.destroy({
        where: { sellerId: params.id },
      }, { transaction: dbTransaction });

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
