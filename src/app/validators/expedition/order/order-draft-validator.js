const joi = require('joi');
const { Sequelize } = require('sequelize');
const { OrderBatch } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

let request = null;

const isExist = async (param) => new Promise(async (resolve, reject) => {
  const seller = await jwtSelector({ request });

  OrderBatch.findOne({
    where: {
      id: param,
      sellerId: seller?.id,
      totalOrderProblem: {
        [Sequelize.Op.ne]: 0,
      },
    },
  }).then((result) => {
    if (!result) reject(new Error('Tidak ada pesanan yang harus di perbaiki pada batch id ini'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  batch_id: joi.number().min(1).required().external((req) => isExist(req)),
});

module.exports = (object) => {
  request = object;
  return validator.validateAsync(object.params, {
    errors: {
      wrap: {
        label: '',
      },
    },
  });
};
