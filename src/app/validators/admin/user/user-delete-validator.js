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
  id: joi.string().required().external((request) => isExists(request)),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
