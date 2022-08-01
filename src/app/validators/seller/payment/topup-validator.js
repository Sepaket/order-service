const joi = require('joi');

const validator = joi.object({
  amount: joi.number().required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
