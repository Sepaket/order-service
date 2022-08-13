const joi = require('joi');
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
  ids: joi.array().items(
    joi.number().min(1).external((req) => isExist({ params: req, identifier: 'id' })),
  ).required().min(1),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
