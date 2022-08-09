const joi = require('joi');

const validator = joi.object({
  page: joi.number().min(1).allow('', null),
  limit: joi.number().min(0).allow('', null),
  keyword: joi.string().allow('', null),
  date_start: joi.date().allow('', null),
  date_end: joi
    .any()
    .when('date_start', {
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
