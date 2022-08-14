const joi = require('joi');
const { Order } = require('../../../models');

const isExists = async ({ params }) => new Promise(async (resolve, reject) => {
  Order.findOne({
    where: { resi: `${params}` },
  }).then((result) => {
    if (!result) reject(new Error('The selected resi is invalid'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  resi: joi
    .string()
    .required()
    .external((req) => isExists({ params: req })),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
