const joi = require('joi');
const moment = require('moment');
const { Location, SellerAddress } = require('../../../models');
const { serviceCode } = require('../../../../constant/status');

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

const codValidator = async () => new Promise((resolve, reject) => {
  const { body } = request;
  const sicepatCondition = (
    body.type === 'SICEPAT'
    && (body.service_code === 'GOKIL' || body.service_code === 'BEST' || body.service_code === 'SIUNTUNG')
    && parseFloat(body.goods_amount) <= parseFloat(15000000)
  );

  const jneCondition = (
    body.type === 'JNE'
    && body.weight <= 70
    && parseFloat(body.goods_amount) <= parseFloat(5000000)
  );

  if (sicepatCondition) resolve(true);
  if (jneCondition) resolve(true);
  reject(new Error('This service code does not exist when you choose COD'));
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
  type: joi.string().required().valid('JNE', 'SICEPAT', 'NINJA', 'IDEXPRESS'),
  seller_location_id: joi
    .number()
    .min(1)
    .required()
    .external((req) => isExist({ params: req, identifier: 'id', model: SellerAddress })),
  receiver_location_id: joi
    .number()
    .min(1)
    .required()
    .external((req) => isExist({ params: req, identifier: 'id', model: Location })),
  weight: joi.number().min(1).required(),
  is_cod: joi.boolean().required(),
  service_code: joi.string().required().when('is_cod', {
    is: true,
    then: joi
      .string()
      .required()
      .external(() => serviceCodeValidator())
      .external(() => codValidator()),
  }),
  sender_name: joi.string().required(),
  sender_phone: joi.string().required(),
  receiver_name: joi.string().required(),
  receiver_phone: joi.string().required(),
  receiver_address: joi.string().max(80).required(),
  receiver_address_note: joi.string().max(20),
  should_pickup_with: joi.string().required().valid('MOTOR', 'MOBIL', 'TRUCK'),
  goods_content: joi.string().max(50).required(),
  goods_amount: joi.number().required(),
  goods_qty: joi.number().min(1).required(),
  notes: joi.string().allow(null, '').max(50),
  is_insurance: joi.boolean().required(),
  pickup_date: joi.date().min(moment().format('YYYY-MM-DD')).required(),
  pickup_time: joi.string().regex(/^([0-9]{2}):([0-9]{2})$/)
    .message({ 'string.pattern.base': 'pickup time format should HH:mm,' })
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
