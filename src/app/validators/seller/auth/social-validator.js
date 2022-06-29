const joi = require('joi');

const validator = joi.object({
  code: joi.string().required(),
  service: joi.string().required(),
  // name: joi.string().required(),
  // email: joi.string().email().required(),
  // social_id: joi.string().required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
