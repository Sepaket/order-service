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
          cod_fee: body.cod_fee,
          cod_fee_type: body.cod_fee_type,
          rate_referal: body.rate_referral,
          rate_referal_type: body.rate_referral_type,
        })
          .then((result) => resolve(result))
          .catch((error) => reject(error));
      } else {
        oldData.update({
          cod_fee: body.cod_fee,
          cod_fee_type: body.cod_fee_type,
          rate_referal: body.rate_referral,
          rate_referal_type: body.rate_referral_type,
        })
          .then((result) => resolve(result))
          .catch((error) => reject(error));
      }
    });
  }
};
