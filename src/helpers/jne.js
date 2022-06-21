const axios = require('axios');
const qs = require('querystring');
require('dotenv').config();

const getOrigin = () => new Promise((resolve, reject) => {
  axios.post(`${process.env.JNE_BASE_URL}/insert/getorigin`, qs.stringify({
    username: process.env.JNE_USERNAME,
    api_key: process.env.JNE_APIKEY,
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    if (!response?.data?.detail) {
      reject(new Error(`JNE: ${response?.data?.error || 'Something Wrong'}`));
      return;
    }

    resolve(response?.data?.detail);
  }).catch((error) => {
    reject(new Error(`JNE: ${error?.data?.reason || error?.message || 'Something Wrong'}`));
  });
});

const getDestination = () => new Promise((resolve, reject) => {
  axios.post(`${process.env.JNE_BASE_URL}/insert/getdestination`, qs.stringify({
    username: process.env.JNE_USERNAME,
    api_key: process.env.JNE_APIKEY,
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    if (!response?.data?.detail) {
      reject(new Error(`JNE: ${response?.data?.error || 'Something Wrong'}`));
      return;
    }

    resolve(response?.data?.detail);
  }).catch((error) => {
    reject(new Error(`JNE: ${error?.data?.reason || error?.message || 'Something Wrong'}`));
  });
});

const checkPrice = (payload) => new Promise((resolve) => {
  const {
    origin,
    destination,
    weight,
  } = payload;

  axios.post(`${process.env.JNE_BASE_URL}/tracing/api/pricedev`, qs.stringify({
    username: process.env.JNE_USERNAME,
    api_key: process.env.JNE_APIKEY,
    from: origin,
    thru: destination,
    weight,
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    resolve(response?.data?.price || []);
  }).catch(() => {
    resolve([]);
  });
});

const createOrder = (payload) => new Promise((resolve, reject) => {
  try {
    axios.post(`${process.env.JNE_BASE_URL}/pickupcashless`, qs.stringify({
      username: process.env.JNE_USERNAME,
      api_key: process.env.JNE_APIKEY,
      ...payload,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then((response) => {
      if (!response?.data?.detail) {
        reject(new Error(`JNE: ${response?.data?.error || 'Something Wrong'}`));
        return;
      }

      resolve(response?.data?.detail);
    }).catch((error) => {
      reject(new Error(`JNE: ${error?.data?.reason || error?.message || 'Something Wrong'}`));
    });
  } catch (error) {
    reject(error);
  }
});

module.exports = {
  getOrigin,
  getDestination,
  checkPrice,
  createOrder,
};
