const md5 = require('md5');
const qs = require('querystring');
const axios = require('axios');
const { IdxLocation } = require('../app/models');

const tokenization = (params) => new Promise((resolve, reject) => {
  try {
    const payload = (typeof params === 'string') ? params : JSON.stringify(params);
    const token = md5(`${payload}${process.env.IDEXPRESS_APP_ID}${process.env.IDEXPRESS_SECURITY_KEY}`);
    resolve(token);
  } catch (error) {
    reject(new Error(`IDexpress: ${error?.message || 'Something Wrong'}`));
  }
});

const getOrigin = () => new Promise(async (resolve, reject) => {
  try {
    const locations = IdxLocation;
    const response = await locations.findAll();

    resolve(response);
  } catch (error) {
    reject(new Error(`IDexpress: ${error?.message || 'Something Wrong'}`));
  }
});

const getDestination = () => new Promise(async (resolve, reject) => {
  try {
    const locations = IdxLocation;
    const response = await locations.findAll();

    resolve(response);
  } catch (error) {
    reject(new Error(`IDexpress: ${error?.message || 'Something Wrong'}`));
  }
});

const checkPrice = (payload) => new Promise(async (resolve) => {
  try {
    const {
      origin,
      destination,
      weight,
      service,
    } = payload;

    const params = JSON.stringify({
      weight,
      expressType: service,
      senderCityId: origin,
      recipientDistrictId: destination,
    });

    const token = await tokenization(params);
    const price = await axios.post(`${process.env.IDEXPRESS_BASE_URL}/open/v1/waybill/get-standard-fee`, qs.stringify({
      appId: process.env.IDEXPRESS_APP_ID,
      sign: token,
      data: params,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    resolve(price?.data?.data);
  } catch (error) {
    resolve(null);
  }
});

module.exports = {
  getOrigin,
  getDestination,
  checkPrice,
};
