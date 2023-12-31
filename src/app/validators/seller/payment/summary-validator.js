const joi = require('joi');

const validator = joi.object({
  filter_by: joi.string().allow('', null).valid('DATE_RANGE', 'MONTH', 'YEAR'),
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
  month: joi.any().when('filter_by', {
    is: 'MONTH',
    then: joi.number().required().valid(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12),
    otherwise: joi.allow('', null),
  }),
  year: joi.any().when('filter_by', {
    is: 'YEAR',
    then: joi.number().required().min(2020),
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
