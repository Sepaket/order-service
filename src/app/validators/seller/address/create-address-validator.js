const joi = require('joi');
const { SellerAddress } = require('../../../models');
const auth = require('../../../../helpers/auth');

let request = null;

const isUnique = async ({ params }) => new Promise((resolve, reject) => {
  const sellerId = auth.sellerId(request);

  SellerAddress.findOne({
    where: { name: params, seller_id: sellerId },
  }).then((result) => {
    if (result) reject(new Error('The name already exists.'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  name: joi.string().required().external((obj) => isUnique({ params: obj })),
  pic_name: joi.string().required(),
  pic_phone: joi.number().min(10).required(),
  address: joi.string().required(),
  address_detail: joi.string().required(),
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
