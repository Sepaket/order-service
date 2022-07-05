const joi = require('joi');

const validator = joi.object({
  type: joi.string().required().valid('JNE', 'SICEPAT', 'NINJA', 'IDEXPRESS', 'ALL'),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
