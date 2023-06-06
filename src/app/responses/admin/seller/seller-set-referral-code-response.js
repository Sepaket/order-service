const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { SellerDetail, CreditHistory, sequelize } = require('../../../models');
const { paymentStatus } = require('../../../../constant/status');
const hash = require('../../../../helpers/hash');
const shortid = require('shortid-36');

module.exports = class {
  constructor({ request }) {
    this.sellerDetail = SellerDetail;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const { params } = this.request;
    console.log('set referral code');
    console.log(params.id);
    const dbTransaction = await sequelize.transaction();
    try {

      await this.sellerDetail.update(
        { referalCode: shortid.generate() },
        { where: { sellerId: params.id }},
        { transaction: dbTransaction }
      ).then(function() {
        // console.log(result);
        console.log("Project with id =1 updated successfully!");

      }).catch(function(e) {
        console.log(e);
        console.log("Project update failed !");
      })

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
