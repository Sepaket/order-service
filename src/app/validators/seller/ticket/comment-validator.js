const joi = require('joi');

const validator = joi.object({
  message: joi.string().required(),
  file: joi.string().allow('', null),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
