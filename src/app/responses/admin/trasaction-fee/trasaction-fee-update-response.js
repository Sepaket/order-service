const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { TransactionFee } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const oldData = await TransactionFee.findOne();

    return new Promise((resolve, reject) => {
      const { body } = this.request;

      if (!oldData) {
        TransactionFee.create({
          codFee: body.cod_fee,
          codFeeType: body.cod_fee_type,
          rateReferal: body.rate_referral,
          rateReferalType: body.rate_referral_type,
        })
          .then((result) => resolve(result))
          .catch((error) => reject(error));
      } else {
        oldData.update({
          codFee: body.cod_fee,
          codFeeType: body.cod_fee_type,
          rateReferal: body.rate_referral,
          rateReferalType: body.rate_referral_type,
        })
          .then((result) => resolve(result))
          .catch((error) => reject(error));
      }
    });
  }
};
