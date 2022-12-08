const joi = require('joi');

const validator = joi.object({
  page: joi.number().min(1).allow('', null),
  limit: joi.number().min(0).allow('', null),
  // status: joi.string().allow('', null).valid('PENDING', 'PAID', 'EXPIRED', 'FAILED'),
  filter_by: joi.string().allow('', null).valid('DATE', 'MONTH', 'YEAR'),
  date_start: joi.any().when('filter_by', {
    is: joi.exist(),
    then: joi.date().required(),
    otherwise: joi.allow('', null),
    // then: joi.allow('', null),
  }),
  date_end: joi.any().when('date_start', {
    is: joi.exist(),
    then: joi.date().required(),
    otherwise: joi.allow('', null),
    // then: joi.allow('', null),
  }),

});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
