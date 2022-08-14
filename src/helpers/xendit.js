const qs = require('querystring');
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
  }).catch((error) => {
    reject(new Error(error?.response?.data?.message || error?.message || error));
  });
});

const withdraw = (payload) => new Promise((resolve, reject) => {
  const {
    amount,
    bankCode,
    externalId,
    accountName,
    accountNumber,
    description,
  } = payload;

  axios.post(`${process.env.XENDIT_BASE_URL}/disbursements`, qs.stringify({
    amount,
    external_id: externalId,
    bank_code: bankCode,
    account_holder_name: accountName,
    account_number: accountNumber,
    description,
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    auth: {
      username: process.env.XENDIT_SECRET_KEY,
      password: '',
    },
  }).then((response) => {
    resolve(response);
  }).catch((error) => {
    reject(new Error(error?.response?.data?.message || error?.message || error));
  });
});

const balance = () => new Promise(() => {
  //
});

module.exports = {
  topup,
  withdraw,
  balance,
};
