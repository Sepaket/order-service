const joi = require('joi');
const { Order } = require('../../../models');
// const orderStatus = require('../../../../constant/order-status');

const isExists = async ({ params }) => new Promise(async (resolve, reject) => {
  Order.findOne({
    where: { resi: `${params}` },
  }).then((result) => {
    if (!result) reject(new Error('The selected resi is invalid'));
    // if (result?.status === orderStatus.
    // CANCELED.text) reject(new Error('Order has been canceled'));
    if (result) resolve(result);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  resi: joi
    .array()
    .items(
      joi.string().external((req) => isExists({ params: req })),
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
