const joi = require('joi');
const { Admin } = require('../../../models');

const isDuplicate = async (request) => new Promise((resolve, reject) => {
  Admin.findOne(({ where: { email: request } })).then((result) => {
    if (result) reject(new Error('This email has been exist, try with another email address'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  username: joi.string().required(),
  email: joi.string().email().required().external((request) => isDuplicate(request)),
  password: joi.string().min(6).required(),
  role: joi.string().required()
    .valid('SUPER_ADMIN', 'STAFF', 'SELLER', 'FINANCE', 'LAST_MILE', 'CONTROL_TOWER'),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
