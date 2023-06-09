const axios = require('axios');
require('dotenv').config();

const getOrigin = () => new Promise((resolve, reject) => {
  axios.get(`${process.env.SAP_BASE_URL_TRACKING}/customer/origin`, {
    headers: {
      'api-key': process.env.SAP_APIKEY_TRACKING,
    },
  }).then((response) => {
    resolve(response?.data?.sap?.results);
  }).catch((error) => {
    reject(
      new Error(
        `SAP: ${
          error?.response?.data?.sap?.status?.description
          || error?.response?.data?.message
          || error?.message
          || 'Something Wrong'
        }`,
      ),
    );
  });
});

const getDestination = () => new Promise((resolve, reject) => {
  axios.get(`${process.env.SAP_BASE_URL_TRACKING}/customer/destination`, {
    headers: {
      'api-key': process.env.SAP_APIKEY_TRACKING,
    },
  }).then((response) => {
    resolve(response?.data?.sap?.results);
  }).catch((error) => {
    reject(
      new Error(
        `SAP: ${
          error?.response?.data?.sap?.status?.description
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
  axios.post(`${process.env.SAP_BASE_URL_CHECKPRICE}/master/shipment_cost/publish`, {
    origin,
      destination,
      weight: weight || 1,
    customer_code: process.env.SAP_CUSTOMER_CODE_CHECKPRICE
  },{
    headers: {
      'api-key': process.env.SAP_APIKEY_GLOBAL,
    },
  }).then((response) => {
    // console.log(response.data)
    resolve(response?.data|| []);
  }).catch((error) => {
    resolve([]);
  });
});

const createOrder = (payload) => new Promise(async (resolve) => {
  axios.post(`${process.env.SAP_BASE_URL_PICKUP}/shipment/pickup/single_push`, {
    auth_key: process.env.SAP_APIKEY_PICKUP,
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
  axios.get(`${process.env.SAP_BASE_URL_TRACKING}/customer/waybill`, {
    params: {
      waybill: resi,
    },
    headers: {
      'api-key': process.env.SAP_APIKEY_TRACKING,
    },
  }).then((response) => {
    resolve(response?.data);
  }).catch((error) => {
    resolve({
      sap: {
        status: {
          code: 500,
          description: error?.message || 'Something Wrong',
        },
      },
    });
  });
});

const cancel = (payload) => new Promise(async (resolve, reject) => {
  axios.post(`${process.env.SAP_BASE_URL_PICKUP}/partner/cancelpickup`, {
    auth_key: process.env.SAP_APIKEY_PICKUP,
    receipt_number: payload.resi,
  }).then((response) => {
    if (response?.data?.status !== '200') {
      console.log('NOT ERROR');
      reject(new Error(`SAP: ${response?.data?.error_message || 'Something Wrong'}`));
      return;
    }

    resolve(response?.data);
  }).catch((error) => {
    console.log('ERROR ');
    reject(new Error(`SAP: ${error?.response?.data?.error_message || 'Something Wrong'}`));

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
