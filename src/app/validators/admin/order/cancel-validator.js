const joi = require('joi');
const { OrderDetail, Order, OrderBackground, Seller } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

let request = null;

const isExists = async ({ params }) => new Promise(async (resolve, reject) => {
  const seller = await jwtSelector({ request });

  // let o = await OrderDetail.findOne({
  //   where: { orderId: params, sellerId: seller?.id },
  //   include: [{ model: Order, as: 'order', required: true },
  let o = await Order.findOne({
    where: { id: params },
    include: [
      { model: OrderDetail, as: 'detail', required: true,
        include: [
          { model: Seller, as: 'seller', required: false },
        ],
      },
      // { model: Seller, as: 'seller', required: false },
      { model: OrderBackground, as: 'background', required: false },

    ],
  }).then((result) => {

    if (!result) reject(new Error('The selected id is invalid'));
    else {
      resolve(result);
    }
    return result;
  }).catch((error) => {
    // console.log(error.message);
    reject(error.message);
  });

  if (o === null) {
    console.log('NULL');
  } else {
    console.log('NOT NULL');
    // console.log(o.background.isExecute);
    if (o.background?.isExecute === false) {
          await o.background.destroy();
    } else {

    }
  }


  // OrderBackground.findOne({
  //   where: { orderId: params, sellerId: seller?.id },
  //   include: [{ model: Order, as: 'order', required: true }],
  // }).then((result) => {
  //   console.log('inside then result');
  //   // console.log(result);
  //   if (!result) reject(new Error('The selected id is invalid'));
  //   else resolve(result);
  // }).catch((error) => {
  //   // console.log(error.message);
  //   reject(error.message);
  // });



});

const validator = joi.object({
  id: joi
    .number()
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
