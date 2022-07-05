const axios = require('axios');
require('dotenv').config();

const getOrigin = () => new Promise((resolve, reject) => {
  axios.get(`${process.env.SICEPAT_BASE_URL_TRACKING}/customer/origin`, {
    headers: {
      'api-key': process.env.SICEPAT_APIKEY_TRACKING,
    },
  }).then((response) => {
    resolve(response?.data?.sicepat?.results);
  }).catch((error) => {
    reject(
      new Error(
        `Sicepat: ${
          error?.response?.data?.sicepat?.status?.description
          || error?.response?.data?.message
          || error?.message
          || 'Something Wrong'
        }`,
      ),
    );
  });
});

const getDestination = () => new Promise((resolve, reject) => {
  axios.get(`${process.env.SICEPAT_BASE_URL_TRACKING}/customer/destination`, {
    headers: {
      'api-key': process.env.SICEPAT_APIKEY_TRACKING,
    },
  }).then((response) => {
    resolve(response?.data?.sicepat?.results);
  }).catch((error) => {
    reject(
      new Error(
        `Sicepat: ${
          error?.response?.data?.sicepat?.status?.description
          || error?.response?.data?.message
          || error?.message
          || 'Something Wrong'
        }`,
      ),
    );
  });
});

const checkPrice = (payload) => new Promise((resolve) => {
  const { origin, destination, weight } = payload;

  axios.get(`${process.env.SICEPAT_BASE_URL_TRACKING}/customer/tariff`, {
    params: { origin, destination, weight },
    headers: {
      'api-key': process.env.SICEPAT_APIKEY_TRACKING,
    },
  }).then((response) => {
    resolve(response?.data?.sicepat?.results || []);
  }).catch(() => {
    resolve([]);
  });
});

const createOrder = (payload) => new Promise(async (resolve, reject) => {
  axios.post(`${process.env.SICEPAT_BASE_URL_PICKUP}/partner/requestpickuppackage`, {
    auth_key: process.env.SICEPAT_APIKEY_PICKUP,
    ...payload,
  }).then((response) => {
    if (!response?.data?.datas) {
      reject(new Error(`SICEPAT: ${response?.data?.error_message}`));
      return;
    }

    resolve(response?.data?.datas);
  }).catch((error) => {
    reject(new Error(`SICEPAT: ${error?.message}`));
  });
});

module.exports = {
  getOrigin,
  getDestination,
  checkPrice,
  createOrder,
};
