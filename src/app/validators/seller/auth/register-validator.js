const joi = require('joi');
const { Seller, SellerDetail } = require('../../../models');

const isDuplicate = async (request) => new Promise((resolve, reject) => {
  Seller.findOne(({ where: { email: request } })).then((result) => {
    if (result) reject(new Error('This email has been exist, try with another email address'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const isExist = async ({ params, identifier }) => new Promise((resolve, reject) => {
  SellerDetail.findOne({
    where: { [`${identifier}`]: params },
  }).then((result) => {
    if (!result) reject(new Error(`This ${identifier.split('_').join(' ')} does not exist`));
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
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/)
    .message({
      'string.pattern.base': 'Password minimal 6 karakter, menggunakan min. 1 huruf kecil, 1 huruf kapital dan tanpa symbol',
    })
    .required(),
  password_confirmation: joi.ref('password'),
  phone: joi.number().min(10).required(),
  referal_code: joi
    .string()
    .email()
    .required()
    .external((request) => isExist({ params: request, identifier: 'referalCode' })),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
