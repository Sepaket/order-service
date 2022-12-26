const joi = require('joi');
const { Ticket } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

let request = null;

const isExists = async ({ params }) => new Promise(async (resolve, reject) => {
  const seller = await jwtSelector({ request });

  Ticket.findOne({
    // where: { id: params, sellerId: seller?.id },
    attributes: [
      ['id', 'ticket_id'],
      'title',
      'message',
      'category',
      'priority',
      'file',
      'comment',
      'status',
      'createdAt',
    ],
    // where: {
    //   id: params.id,
    //   sellerId: seller.id,
    // },
    include: [
      {
        model: this.order,
        as: 'order',
        required: true,
        attributes: [
          ['id', 'order_id'],
          'resi',
        ],
        where: {
          resi: params.resi,
        },
      },
      {
        model: this.seller,
        as: 'seller',
        required: true,
        attributes: [
          ['id', 'seller_id'],
          'name',
        ],
      },
    ],
  }).then((result) => {
    if (!result) reject(new Error('The selected id is invalid'));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const validator = joi.object({
  resi: joi
    .required()
    .external((req) => isExists({ params: req })),
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
