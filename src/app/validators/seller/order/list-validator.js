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
  page: joi.number().min(1).allow('', null),
  limit: joi.number().min(0).allow('', null),
  keyword: joi.string().allow('', null),
  batch_id: joi.number().min(1).required().external((req) => isExists({ params: req })),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
