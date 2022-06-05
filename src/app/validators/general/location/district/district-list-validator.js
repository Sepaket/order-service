const joi = require('joi');
const { City } = require('../../../../models');

const isExist = async ({ params, identifier }) => new Promise((resolve, reject) => {
  City.findOne({
    where: { [`${identifier}`]: params },
  }).then((result) => {
    if (!result) reject(new Error(`This ${identifier.split('_').join(' ')} does not exist`));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  page: joi.number().min(1).allow('', null),
  limit: joi.number().min(0).allow('', null),
  keyword: joi.string().allow('', null),
  city_id: joi.any()
    .external((request) => isExist({ params: request, identifier: 'id' }))
    .required(),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
