const joi = require('joi');

const validator = joi.object({
  type: joi.string().required().allow('excel'),
  batch_id: joi.number().allow('', null),
  date_start: joi.date().allow('', null),
  date_end: joi.date().allow('', null),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
