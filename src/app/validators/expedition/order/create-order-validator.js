const joi = require('joi');
const moment = require('moment');
const { Location } = require('../../../models');

const isExist = async ({ params, identifier }) => new Promise((resolve, reject) => {
  Location.findOne({
    where: { [`${identifier}`]: params },
  }).then((result) => {
    if (!result) reject(new Error(`This ${identifier.split('_').join(' ')} does not exist`));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  type: joi.string().required().valid('JNE', 'SICEPAT', 'NINJA', 'IDEXPRESS', 'ALL'),
  origin: joi.number().min(1).required().external((request) => isExist({ params: request, identifier: 'id' })),
  destination: joi.number().min(1).required().external((request) => isExist({ params: request, identifier: 'id' })),
  weight: joi.number().min(1).required(),
  service_code: joi.string().required(),
  seller_address_id: joi.number().min(1).required().external((request) => isExist({ params: request, identifier: 'id' })),
  sender_name: joi.string().required(),
  sender_phone: joi.string().required(),
  receiver_name: joi.string().required(),
  receiver_phone: joi.string().required(),
  receiver_address: joi.number().min(1).required(),
  receiver_address_id: joi.number().min(1).required().external((request) => isExist({ params: request, identifier: 'id' })),
  should_pickup_with: joi.string().required().valid('MOTOR', 'MOBIL', 'TRUCK'),
  is_cod: joi.boolean().required(),
  goods_content: joi.string().required(),
  goods_amount: joi.number().required(),
  pickup_date: joi.date().min(moment().format('YYYY-MM-DD')).required(),
  pickup_time: joi.string().regex(/^([0-9]{2})\/:([0-9]{2})$/).required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
