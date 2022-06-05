const joi = require('joi');
const { SubDistrict } = require('../../../../models');

const isExist = async ({ params, identifier }) => new Promise((resolve, reject) => {
  SubDistrict.findOne({
    where: { [`${identifier}`]: params },
  }).then((result) => {
    if (!result) reject(new Error(`This ${identifier.split('_').join(' ')} does not exist`));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  id: joi.number()
    .min(1)
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
