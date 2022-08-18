const joi = require('joi');

const validator = joi.object({
  type: joi.string()
    .required()
    .valid('non-delivered', 'delivered', 'problem', 'total-cod'),
  expedition: joi.string()
    .valid('JNE', 'SICEPAT', 'NINJA', 'IDEXPRESS'),
  start_date: joi.date().allow('', null),
  end_date: joi
    .any()
    .when('start_date', {
      is: joi.exist(),
      then: joi.date().required(),
      otherwise: joi.allow('', null),
    }),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
