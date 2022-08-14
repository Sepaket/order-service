const joi = require('joi');
const { Seller } = require('../../../models');

const isExists = async (request) => new Promise((resolve, reject) => {
  Seller.findOne(({ where: { id: request } })).then((result) => {
    if (!result) reject(new Error('The selected id is invalid'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  seller_id: joi.string().required().external((request) => isExists(request)),
  cod_fee: joi.number().required().min(0),
  cod_fee_type: joi.string().valid('PERCENTAGE', 'AMOUNT'),
  rate_referral: joi.number().required().min(0),
  rate_referral_type: joi.string().valid('PERCENTAGE', 'AMOUNT'),
  discount_rate: joi.number().required().min(0),
  discount_rate_type: joi.string().valid('PERCENTAGE', 'AMOUNT'),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
