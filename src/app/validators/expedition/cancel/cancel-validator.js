const joi = require('joi');
const { Order } = require('../../../models');

const isExists = async ({ params }) => new Promise(async (resolve, reject) => {
  Order.findOne({
    where: { id: `${params}` },
  }).then((result) => {
    if (!result) reject(new Error('The selected resi is invalid'));
    if (result) resolve(result);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  ids: joi
    .array()
    .items(
      joi.number().external((req) => isExists({ params: req })),
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
