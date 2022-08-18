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
  type: joi.string().required().valid('JNE', 'SICEPAT', 'NINJA', 'IDEXPRESS', 'ALL'),
  origin: joi
    .number()
    .min(1)
    .required()
    .external((request) => isExist({ params: request, identifier: 'id' }))
    .error((errs) => {
      errs.forEach((err) => {
        if (err?.code === 'number.min') throw new Error('Harap masukan daerah asal');
        if (err?.code === 'number.base') throw new Error('Harap masukan daerah asal');
        if (err?.code === 'any.required') throw new Error('Harap masukan daerah asal');
      });
    }),
  destination: joi
    .number()
    .min(1)
    .required()
    .external((request) => isExist({ params: request, identifier: 'id' }))
    .error((errs) => {
      errs.forEach((err) => {
        if (err?.code === 'number.min') throw new Error('Harap masukan daerah tujuan');
        if (err?.code === 'number.base') throw new Error('Harap masukan daerah tujuan');
        if (err?.code === 'any.required') throw new Error('Harap masukan daerah tujuan');
      });
    }),
  weight: joi.number().min(1).required(),
  goods_amount: joi
    .number()
    .error((errs) => {
      errs.forEach((err) => {
        if (err?.code === 'number.min') throw new Error('Harap masukan perkiraan harga barang');
        if (err?.code === 'number.base') throw new Error('Harap masukan perkiraan harga barang');
        if (err?.code === 'any.required') throw new Error('Harap masukan perkiraan harga barang');
      });
    }),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
