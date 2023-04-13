const joi = require('joi');
const { Seller } = require('../../../models');

const isExist = async ({ params, identifier }) => new Promise((resolve, reject) => {
  Seller.findOne({
    where: { [`${identifier}`]: params },
  }).then((result) => {
    if (!result) reject(new Error(`This ${identifier.split('_').join(' ')} does not exist`));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});


const phoneoremail = async ({ params, identifier }) => new Promise((resolve, reject) => {
  Seller.findOne({
    where: { [`${identifier}`]: params },
  }).then((result) => {
    if (!result) reject(new Error(`This ${identifier.split('_').join(' ')} does not exist`));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});




const validator = joi.object({
  // email: joi.string().external((request) => phoneoremail({ params: request, identifier: 'email' })),
  email: joi.string().email().required().external((request) => isExist({ params: request, identifier: 'email' })),
  password: joi.string().required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
