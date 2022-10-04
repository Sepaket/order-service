const joi = require('joi');
const { OrderDetail, Order } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

let request = null;

const isExists = async ({ params }) => new Promise(async (resolve, reject) => {
  const seller = await jwtSelector({ request });

  OrderDetail.findOne({
    where: { orderId: params, sellerId: seller?.id },
    include: [{ model: Order, as: 'order', required: true }],
  }).then((result) => {
    if (!result) reject(new Error('The selected id is invalid'));
    else resolve(result);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  id: joi
    .number()
    .required()
    .external((req) => isExists({ params: req })),
});

module.exports = (object) => {
  request = object;
  return validator.validateAsync(object.params, {
    errors: {
      wrap: {
        label: '',
      },
    },
  });
};
