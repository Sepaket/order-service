const axios = require('axios');

const topup = (payload) => new Promise(async (resolve, reject) => {
  const { amount, email, externalId } = payload;

  axios.post(`${process.env.XENDIT_BASE_URL}/v2/invoices/`, {
    amount,
    external_id: externalId,
    customer: { email },
  }, {
    auth: {
      username: process.env.XENDIT_SECRET_KEY,
      password: '',
    },
  }).then((response) => {
    resolve(response);
  }).catch(async (error) => {
    reject(new Error(error));
  });
});

const withdraw = () => new Promise(() => {
  //
});

const balance = () => new Promise(() => {
  //
});

module.exports = {
  topup,
  withdraw,
  balance,
};
