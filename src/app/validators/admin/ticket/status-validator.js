const joi = require('joi');
const { Ticket } = require('../../../models');

const isExists = async ({ params }) => new Promise(async (resolve, reject) => {
  Ticket.findOne({
    where: { id: params },
  }).then((result) => {
    if (!result) reject(new Error('The selected id is invalid'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  id: joi
    .number()
    .required()
    .external((req) => isExists({ params: req })),
  status: joi.string().required().allow('process', 'solved'),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
