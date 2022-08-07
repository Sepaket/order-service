const joi = require('joi');
const { Discount } = require('../../../models');

const isExists = async (request) => new Promise((resolve, reject) => {
  Discount.findOne(({ where: { id: request } })).then((result) => {
    if (!result) reject(new Error('The selected id is invalid'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  new: joi.array().items(
    joi.object({
      value: joi.number().min(0).required(),
      type: joi.string().required().valid('PERCENTAGE', 'AMOUNT'),
      minimum_order: joi.number().min(0).required(),
      maximum_order: joi.number().min(0).required(),
    }).min(0),
  ),
  update: joi.array().items(
    joi.object({
      id: joi.number().required().external((request) => isExists(request)),
      value: joi.number().min(0).required(),
      type: joi.string().required().valid('PERCENTAGE', 'AMOUNT'),
      minimum_order: joi.number().min(0).required(),
      maximum_order: joi.number().min(0).required(),
    }).min(0),
  ),
  delete: joi.array().items(joi.number().external((request) => isExists(request))).min(0),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
