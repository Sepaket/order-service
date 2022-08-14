const joi = require('joi');

const validator = joi.array().items(joi.object({
  expedition: joi.string().required().valid('JNE', 'SICEPAT', 'IDEXPRESS', 'NINJA'),
  insurance_value: joi.number().positive().allow(0).required(),
  insurance_value_type: joi.string().required().valid('PERCENTAGE', 'AMOUNT'),
  admin_fee: joi.number().positive().allow(0).required(),
  admin_fee_type: joi.string().required().valid('PERCENTAGE', 'AMOUNT'),
}));

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
