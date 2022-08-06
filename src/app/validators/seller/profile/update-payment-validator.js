const joi = require('joi');
const { Bank } = require('../../../models');

const isIdExists = async ({ params }) => new Promise(async (resolve, reject) => {
  Bank.findOne({
    where: { id: params },
  }).then((result) => {
    if (!result) reject(new Error('The selected id is invalid'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  bank_id: joi.number().required().external((req) => isIdExists({ params: req })),
  account_name: joi.string().required(),
  account_number: joi.string().min(5).required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
