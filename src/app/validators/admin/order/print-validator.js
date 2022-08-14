const joi = require('joi');
const { OrderBatch, Order } = require('../../../models');

const isExists = async ({ params, model }) => new Promise(async (resolve, reject) => {
  model.findOne({
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
  order_ids: joi
    .array()
    .items(
      joi.number().external((req) => isExists({ params: req, model: Order })),
    )
    .required(),
  batch_ids: joi
    .array()
    .items(
      joi.number().external((req) => isExists({ params: req, model: OrderBatch })),
    )
    .required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
