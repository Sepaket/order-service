const { Location } = require('../app/models');

const isExist = async ({ param, identifier, model }) => new Promise((resolve) => {
  model.findOne({
    where: { [`${identifier}`]: param },
  })
    .then((result) => resolve(!result))
    .catch(() => resolve(false));
});

const required = (param) => new Promise((resolve) => {
  if (param === '' || param === null) resolve(true);
  else resolve(false);
});

const validate = (payload) => new Promise(async (resolve, reject) => {
  try {
    const error = [];
    const {
      creditCondition,
    } = payload;
    // console.log('ordfer validator ')

    if (!payload.is_cod && !creditCondition) error.push({ message: 'Saldo anda tidak cukup untuk melakukan pengiriman menggunakan lalamove' });

    resolve(error);
  } catch (error) {
    reject(error);
  }
});

module.exports = validate;
