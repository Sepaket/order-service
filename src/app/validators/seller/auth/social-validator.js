const joi = require('joi');

const validator = joi.object({
  social_id: joi.string().required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
