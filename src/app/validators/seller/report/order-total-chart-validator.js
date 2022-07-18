const joi = require('joi')
  .extend(require('@joi/date'));

const validator = joi.object({
  type: joi.string().valid('qty', 'amount').required(),
  date: joi.date().format('YYYY-MM-DD'),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
