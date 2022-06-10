const joi = require('joi');
const { Seller } = require('../../../models');

const isDuplicate = async (request) => new Promise((resolve, reject) => {
  Seller.findOne(({ where: { email: request } })).then((result) => {
    if (result) reject(new Error('This email has been exist, try with another email address'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required().external((request) => isDuplicate(request)),
  password: joi.string()
    .min(6)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$@!%&*?])[A-Za-z\d#$@!%&*?]{6,}$/)
    .message({
      'string.pattern.base': 'password must include low character, capital character, special character, and number,',
    })
    .required(),
  password_confirmation: joi.ref('password'),
  phone: joi.number().min(10).required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});