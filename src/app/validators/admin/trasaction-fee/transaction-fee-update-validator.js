const joi = require('joi');

const validator = joi.object({
  cod_fee: joi.number().min(0).required(),
  cod_fee_type: joi.string().required().valid('PERCENTAGE', 'AMOUNT'),
  rate_referral: joi.number().min(0).required(),
  rate_referral_type: joi.string().required().valid('PERCENTAGE', 'AMOUNT'),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
