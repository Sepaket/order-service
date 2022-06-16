const joi = require('joi');
const { SellerAddress } = require('../../../models');
const auth = require('../../../../helpers/auth');

let request = null;

const isExists = async ({ params }) => new Promise((resolve, reject) => {
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

const validator = joi.object({
  id: joi.number().required().external((obj) => isExists({ params: obj })),
});

module.exports = (object) => {
  request = object;
  return validator.validateAsync(object.query, {
    errors: {
      wrap: {
        label: '',
      },
    },
  });
};
