const joi = require('joi');
const moment = require('moment');
const { Location, SellerAddress } = require('../../../models');
const { serviceCode, sicepatParcelCategories } = require('../../../../constant/status');

let request = null;
const isExist = async ({ params, identifier, model }) => new Promise((resolve, reject) => {
  model.findOne({
    where: { [`${identifier}`]: params },
  }).then((result) => {
    if (!result) reject(new Error(`This ${identifier.split('_').join(' ')} does not exist`));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const serviceCodeValidator = async () => new Promise((resolve, reject) => {
  const { body } = request;
  const exist = serviceCode[body.type]?.find((item) => item.code === body.service_code);

  if (exist) resolve(true);
  else reject(new Error('This service code does not exist'));
});

/*
  NOTE

  address length validation from 3pl :
  - sicepat: 400 char
  - jne: 80 char
  - ninja: 100 char
  - idexpress: 500 char
*/

const validator = joi.object({
  batch_id: joi.number().allow(null),
  type: joi.string().required().valid('JNE', 'SICEPAT', 'NINJA', 'IDEXPRESS'),
  service_code: joi
    .string()
    .required()
    .external(() => serviceCodeValidator()),
  should_pickup_with: joi.string().required().valid('MOTOR', 'MOBIL', 'TRUCK'),
  pickup_date: joi.date().min(moment().format('YYYY-MM-DD')).required(),
  pickup_time: joi.string().regex(/^([0-9]{2}):([0-9]{2})$/)
    .message({ 'string.pattern.base': 'pickup time format should HH:mm,' })
    .required(),
  seller_location_id: joi
    .number()
    .min(1)
    .required()
    .external((req) => isExist({ params: req, identifier: 'id', model: SellerAddress })),
  order_items: joi.array().items(joi.object({
    receiver_location_id: joi
      .number()
      .min(1)
      .required()
      .external((req) => isExist({ params: req, identifier: 'id', model: Location })),
    weight: joi.number().min(1).max(50).required(),
    is_cod: joi.boolean().required(),
    sender_name: joi.string().required(),
    sender_phone: joi.string().required(),
    receiver_name: joi.string().required(),
    receiver_phone: joi.string().required(),
    receiver_address: joi.string().max(80).required(),
    receiver_address_note: joi.string().max(20),
    goods_content: joi.string().max(50).required(),
    goods_category: joi
      .string()
      .required()
      .allow(
        sicepatParcelCategories.ORGANIC,
        sicepatParcelCategories.NORMAL,
        sicepatParcelCategories.ELECTRONIC,
      ),
    cod_value: joi.any().when('is_cod', {
      is: joi.boolean().valid(true),
      then: joi.number().min(1).required(),
      otherwise: joi.allow(0),
    }),
    goods_amount: joi.any().when('is_cod', {
      is: joi.boolean().valid(false),
      then: joi.number().min(10000).max(5000000).required(),
      otherwise: joi.allow(0),
    }),
    goods_qty: joi.number().min(1).required(),
    notes: joi.string().allow(null, '').max(50),
    is_insurance: joi.boolean().required(),
  })).required(),
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
