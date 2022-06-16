const joi = require('joi');
const { Op } = require('sequelize');
const { SellerAddress } = require('../../../models');
const auth = require('../../../../helpers/auth');

let request = null;

const isIdExists = async ({ params }) => new Promise((resolve, reject) => {
  const sellerId = auth.sellerId(request);
  SellerAddress.findOne({
    where: { id: params, seller_id: sellerId },
  }).then((result) => {
    if (!result) reject(new Error('The selected id is invalid.'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const isNameUnique = async ({ params }) => new Promise((resolve, reject) => {
  const sellerId = auth.sellerId(request);
  SellerAddress.findOne({
    where: {
      name: params,
      seller_id: sellerId,
      id: {
        [Op.ne]: request.body.id,
      },
    },
  }).then((result) => {
    if (result) reject(new Error('The name already exists.'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  id: joi.number().required().external((obj) => isIdExists({ params: obj })),
  name: joi.string().required().external((obj) => isNameUnique({ params: obj })),
  pic_name: joi.string().required(),
  pic_phone: joi.number().min(10).required(),
  address: joi.string().required(),
  address_detail: joi.string().required(),
  status: joi.number().min(0).max(1)
    .required(),
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
