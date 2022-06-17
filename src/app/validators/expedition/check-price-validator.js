const joi = require('joi');
const { Location } = require('../../models');

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
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
