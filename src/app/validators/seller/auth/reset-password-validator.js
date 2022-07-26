const joi = require('joi');
const { Seller } = require('../../../models');

const isExist = async ({ params }) => new Promise((resolve, reject) => {
  Seller.findOne({
    where: { forgot_password_token: params },
  }).then((result) => {
    if (!result) reject(new Error('This token is invalid'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  token: joi.string()
    .required()
    .external((request) => isExist({ params: request })),
  new_password: joi.string()
    .min(6)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/)
    .message({
      'string.pattern.base': 'password must include low character, capital character, special character, and number,',
    })
    .required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
