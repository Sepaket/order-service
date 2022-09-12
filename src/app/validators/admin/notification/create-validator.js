const joi = require('joi');
const moment = require('moment');

const validator = joi.object({
  title: joi.string().required(),
  message: joi.string().required().min(15),
  start_date: joi.date().min(moment().format('YYYY-MM-DD')).required(),
  end_date: joi.string().required(),
  is_draft: joi.boolean().required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
