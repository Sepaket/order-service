const joi = require('joi');

const validator = joi.object({
  page: joi.number().min(1).allow('', null),
  limit: joi.number().min(0).allow('', null),
  status: joi.string().allow('', null).valid('PENDING', 'PAID', 'EXPIRED', 'FAILED'),
  filter_by: joi.string().allow('', null).valid('DATE', 'MONTH', 'YEAR'),
  date_start: joi.any().when('filter_by', {
    is: 'DATE_RANGE',
    then: joi.date().required(),
    otherwise: joi.allow('', null),
  }),
  date_end: joi.any().when('date_start', {
    is: joi.exist(),
    then: joi.date().required(),
    otherwise: joi.allow('', null),
  }),
  month_start: joi.any().when('filter_by', {
    is: 'MONTH_RANGE',
    // then: joi.number().required().valid(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12),
    then: joi.date().required(),
    otherwise: joi.allow('', null),
  }),
  month_end: joi.any().when('month_start', {
    is: joi.exist(),
    // then: joi.number().required().valid(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12),
    then: joi.date().required(),
    otherwise: joi.allow('', null),
  }),
  year_start: joi.any().when('filter_by', {
    is: 'YEAR_RANGE',
    // then: joi.number().required().min(2020),
    then: joi.date().required(),
    otherwise: joi.allow('', null),
  }),
  year_end: joi.any().when('year_start', {
    is: joi.exist(),
    // then: joi.number().required().min(2020),
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
