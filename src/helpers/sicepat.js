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
    params: {
      origin,
      destination,
      weight: weight || 1,
    },
    headers: {
      'api-key': process.env.SICEPAT_APIKEY_TRACKING,
    },
  }).then((response) => {
    resolve(response?.data?.sicepat?.results || []);
  }).catch(() => {
    resolve([]);
  });
});

const createOrder = (payload) => new Promise(async (resolve) => {
  axios.post(`${process.env.SICEPAT_BASE_URL_PICKUP}/partner/requestpickuppackage`, {
    auth_key: process.env.SICEPAT_APIKEY_PICKUP,
    ...payload,
  }).then((response) => {
    if (!response?.data?.datas) {
      resolve({
        status: false,
        message: response?.data?.error_message,
      });
      return;
    }

    resolve({
      status: true,
      message: 'OK',
    });
  }).catch((error) => {
    resolve({
      status: false,
      message: error?.response?.data?.error_message || error?.message || 'Something Wrong',
    });
  });
});

const tracking = (payload) => new Promise(async (resolve) => {
  const { resi } = payload;
  axios.get(`${process.env.SICEPAT_BASE_URL_TRACKING}/customer/waybill`, {
    params: {
      waybill: resi,
    },
    headers: {
      'api-key': process.env.SICEPAT_APIKEY_TRACKING,
    },
  }).then((response) => {
    resolve(response?.data);
  }).catch((error) => {
    resolve({
      sicepat: {
        status: {
          code: 500,
          description: error?.message || 'Something Wrong',
        },
      },
    });
  });
});

const cancel = (payload) => new Promise(async (resolve) => {
  axios.post(`${process.env.SICEPAT_BASE_URL_PICKUP}/partner/cancelpickup`, {
    auth_key: process.env.SICEPAT_APIKEY_PICKUP,
    receipt_number: payload.resi,
  }).then((response) => {
    if (response?.data?.status !== '200') {
      resolve({
        status: false,
        message: response?.data?.error_message || 'Something Wrong',
      });
      return;
    }

    resolve(response?.data);
  }).catch((error) => {
    resolve({
      status: false,
      message: error?.message,
    });
  });
});

module.exports = {
  getOrigin,
  getDestination,
  checkPrice,
  createOrder,
  tracking,
  cancel,
};
