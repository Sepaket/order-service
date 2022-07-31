const joi = require('joi');
const { CreditHistory } = require('../../../models');

const isExist = async (param) => new Promise((resolve, reject) => {
  CreditHistory.findOne({
    where: { externalId: param },
  }).then((result) => {
    if (!result) reject(new Error('Invalid Data'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  external_id: joi.string().required().external((req) => isExist(req)),
  amount: joi.number().required(),
  status: joi.string().required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
