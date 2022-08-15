const joi = require('joi');

const validator = joi.object({
  ids: joi.array().items(
    joi.number(),
  ).required().min(1),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
