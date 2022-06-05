const joi = require('joi');

const validator = joi.object({
  page: joi.number().min(1).allow('', null),
  limit: joi.number().min(0).allow('', null),
  keyword: joi.string().allow('', null),
  province_id: joi.number().min(1),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
