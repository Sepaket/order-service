const joi = require('joi');

const validator = joi.object({
  photo: joi.string().allow('', null),
  name: joi.string().required(),
  email: joi.string().email().required(),
  phone: joi.number().min(10).required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
