const joi = require('joi');
const { OrderBatch } = require('../../../models');

const isExists = async ({ params }) => new Promise(async (resolve, reject) => {
  OrderBatch.findOne({
    where: { id: params },
  }).then((result) => {
    if (!result) reject(new Error('The selected id is invalid'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  type: joi.string().required().allow('AWB'),
  ids: joi.array().items(joi.number().external((req) => isExists({ params: req }))).required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
