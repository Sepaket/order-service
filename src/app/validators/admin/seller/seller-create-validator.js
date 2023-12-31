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
  username: joi.string().required(),
  email: joi.string().email().required().external((request) => isDuplicate(request)),
  password: joi.string()
    .min(6)
    .required(),
  // .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/)
  // .message({
  //   'string.pattern.base': 'password must include low character, capital character, and number,',
  // })
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
