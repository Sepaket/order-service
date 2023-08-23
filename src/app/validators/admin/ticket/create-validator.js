const joi = require('joi');
const { OrderDetail } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

let request = null;

const isExist = async (param) => new Promise(async (resolve, reject) => {
  const seller = await jwtSelector({ request });

  OrderDetail.findOne({
    where: { orderId: param,
      // sellerId: seller.id
    },
  }).then((result) => {
    if (!result) reject(new Error('This order does not exist'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  order_id: joi.number().required().external((req) => isExist(req)),
  title: joi.string().required(),
  message: joi.string().required(),
  category: joi.string().required().allow(1, 2, 3, 4, 5, 6, 7),
  priority: joi.string().required().allow('LOW', 'MEDIUM', 'HIGH'),
  file: joi.string().allow('', null),
});

module.exports = (object) => {
  request = object;
  return validator.validateAsync(object.body, {
    errors: {
      wrap: {
        label: '',
      },
    },
  });
};
