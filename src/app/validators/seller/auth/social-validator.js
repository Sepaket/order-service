const joi = require('joi');

const validator = joi.object({
  service: joi.string().valid('facebook', 'google').required(),
  code: joi.when('service', {
    is: joi.string().valid('google'),
    then: joi.required(),
  }),
  name: joi.when('service', {
    is: joi.string().valid('facebook'),
    then: joi.required(),
  }),
  email: joi.when('service', {
    is: joi.string().valid('facebook'),
    then: joi.required(),
  }),
  social_id: joi.when('service', {
    is: joi.string().valid('facebook'),
    then: joi.required(),
  }),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
