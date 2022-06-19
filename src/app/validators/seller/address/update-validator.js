const joi = require('joi');
const { SellerAddress, Location } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

let request = null;

const isIdExists = async ({ params }) => new Promise(async (resolve, reject) => {
  const seller = await jwtSelector({ request });

  SellerAddress.findOne({
    where: { id: params, sellerId: seller?.id },
  }).then((result) => {
    if (!result) reject(new Error('The selected id is invalid'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const isNameUnique = async ({ params }) => new Promise(async (resolve, reject) => {
  const seller = await jwtSelector({ request });

  SellerAddress.findOne({
    where: {
      name: params,
      sellerId: seller?.id,
      id: request.params.id,
    },
  }).then((result) => {
    if (result) reject(new Error('The name already exists.'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const isExist = async (param) => new Promise((resolve, reject) => {
  Location.findOne({
    where: { id: param },
  }).then((result) => {
    if (!result) reject(new Error('This location does not exist'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  id: joi.number().required().external((req) => isIdExists({ params: req })),
  name: joi.string().required().external((req) => isNameUnique({ params: req })),
  pic_name: joi.string().required(),
  pic_phone: joi.number().min(10).required(),
  address: joi.string().required(),
  location_id: joi.number().required().external((req) => isExist(req)),
  status: joi.boolean().required(),
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
