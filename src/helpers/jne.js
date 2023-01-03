const axios = require('axios');
const moment = require('moment');
const shortid = require('shortid-36');
const qs = require('querystring');
require('dotenv').config();


const caseConverter = ({ parameter }) => {
  // eslint-disable-next-line no-unused-vars
  const { body } = this.request;

  return Object.keys(parameter).reduce((accumulator, key) => {
    accumulator[key.toUpperCase()] = parameter[key];
    return accumulator;
  }, {});
};

String.prototype.escapeSpecialCharsInJSONString = function() {

  // return this .replace(/[\\]/g, '\\\\')
  //   .replace(/[\"]/g, '\\\"')
  //   .replace(/[\/]/g, '\\/')
  //   .replace(/[\b]/g, '\\b')
  //   .replace(/[\f]/g, '\\f')
  //   .replace(/[\n]/g, '\\n')
  //   .replace(/[\r]/g, '\\r')
  //   .replace(/[\t]/g, '\\t');


  return this .replace(/[\\]/g, '\\\\')
    .replace(/[\"]/g, '\\\"')
    .replace(/[\/]/g, '\\/')
    .replace(/[\b]/g, ' ')
    .replace(/[\f]/g, ' ')
    .replace(/[\n]/g, ' ')
    .replace(/[\r]/g, ' ')
    .replace(/[\t]/g, ' ');
};


const payloadFormatter = (payload) => {
  // eslint-disable-next-line no-unused-vars
  // payload['GOODS_DESC'] = payload['GOODS_DESC'].replace(/\n/gi, " ");
  // payload['PICKUP_ADDRESS'] = payload['PICKUP_ADDRESS'].replace(/\n/gi, " ");
  // payload['RECEIVER_ADDR1'] = payload['RECEIVER_ADDR1'].replace(/\n/gi, " ");
  // payload['SPECIAL_INS'] = payload['SPECIAL_INS'].replace(/\n/gi, " ");

  payload['GOODS_DESC'] = payload['GOODS_DESC'].escapeSpecialCharsInJSONString();
  payload['PICKUP_ADDRESS'] = payload['PICKUP_ADDRESS'].escapeSpecialCharsInJSONString();
  payload['RECEIVER_ADDR1'] = payload['RECEIVER_ADDR1'].escapeSpecialCharsInJSONString();
  payload['SPECIAL_INS'] = payload['SPECIAL_INS'].escapeSpecialCharsInJSONString();

  console.log('payload formatter goods desc ' + payload['GOODS_DESC']);
  return payload;
};



const parameter = (payload) => new Promise((resolve, reject) => {
  try {
    const params = {
      pickup_name: this.sellerData?.name || '',
      pickup_date: payload.pickup_date.split('-').reverse().join('-'),
      pickup_time: payload.pickup_time,
      pickup_pic: payload.sellerAddress?.picName || '',
      pickup_pic_phone: payload.sellerAddress?.picPhoneNumber || '',
      pickup_address: payload.sellerAddress?.address || '',
      pickup_district: payload.origin?.district || '',
      pickup_city: payload.origin?.city || '',
      pickup_service: 'Domestic',
      pickup_vehicle: payload.should_pickup_with,
      branch: payload.origin?.jneOriginCode || '',
      cust_id: payload.is_cod ? process.env.JNE_CUSTOMER_COD : process.env.JNE_CUSTOMER_NCOD,
      order_id: `${shortid.generate()}${moment().format('YYMDHHmmss')}`,
      shipper_name: payload.sender_name || '',
      shipper_addr1: payload.sellerAddress?.address?.slice(0, 80) || '',
      shipper_city: payload.origin?.city || '',
      shipper_zip: payload.origin?.postalCode || '',
      shipper_region: payload.origin?.province || '',
      shipper_country: 'Indonesia',
      shipper_contact: payload.sender_name,
      shipper_phone: this.sellerAddress?.picPhoneNumber || '',
      receiver_name: payload.receiver_name,
      receiver_addr1: payload.receiver_address,
      receiver_city: payload.destination?.city || '',
      receiver_zip: payload.destination?.postalCode || '',
      receiver_region: payload.destination?.province || '',
      receiver_country: 'Indonesia',
      receiver_contact: payload.receiver_name,
      receiver_phone: payload.receiver_phone,
      origin_code: payload.origin?.jneOriginCode || '',
      destination_code: payload.destination?.jneDestinationCode || '',
      service_code: payload.service_code,
      weight: payload.weight,
      qty: payload.goods_qty,
      goods_desc: (payload.goods_content).replace(/\n/gi, ' '),
      goods_amount: payload.goodsAmount,
      insurance_flag: payload.is_insurance ? 'Y' : 'N',
      special_ins: '',
      merchant_id: this.sellerData.id,
      type: 'PICKUP',
      cod_flag: payload.is_cod ? 'YES' : 'NO',
      cod_amount: payload?.is_cod ? payload?.cod_value : 0,
      awb: payload.resi,
    };
    // console.log('params');
    // console.log(params);
    const paramsConverted = caseConverter(params);
    resolve(paramsConverted);
  } catch (error) {
    reject(error);
  }
});


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
    weight: weight || 1,
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

const createOrder = (payload) => new Promise((resolve) => {
  try {
    // console.log(qs.stringify({
    //   username: process.env.JNE_USERNAME,
    //   api_key: process.env.JNE_APIKEY,
    //   ...payload,
    // }));
    // console.log('jne.js - create order');
    console.log('==============');
    // var pars = this.parameter(payload);
    // console.log(pars);
    // payload['GOODS_DESC'] = payload['GOODS_DESC'].replace(/\n/gi, " ");

    const payloadFormatted = payloadFormatter(payload);
    // console.log(parameter(payload));
    // console.log(JSON.stringify(payload));
    const payloadStringify = qs.stringify({
      username: process.env.JNE_USERNAME,
      api_key: process.env.JNE_APIKEY,
      ...payloadFormatted,
    });
    // const payloadObj = payloadStringify.replace(/\n/gi, ' ');
    axios.post(`${process.env.JNE_BASE_URL}/pickupcashless`, payloadStringify, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // 'Accept-Encoding': 'gzip, deflate, br',
        // 'Content-Length' : 1000000000000,
      },
    }).then((response) => {
      console.log('======================inside then');
      if (!response?.data?.detail) {
        resolve({
          status: false,
          message: response?.data?.error || 'Something Wrong',
        });
        return;
      }

      const status = (response.data.detail[0]['status']).toLowerCase();
      if (status === 'error') {
        resolve({
          status: false,
          message: response.data.detail[0]['reason'],
        });
        return;
      }
      resolve({
        status: true,
        message: response,
      });
    }).catch((error) => {
      // console.log(`this is error : ${  error?.response?.data?.reason}`);
      resolve({
        status: false,
        message: error?.response?.data?.reason || error?.message || 'Something Wrong',
      });
    });
  } catch (error) {
    resolve({
      status: false,
      message: error?.message || 'Something Wrong',
    });
  }
});

const tracking = (payload) => new Promise((resolve, reject) => {
  try {
    const { resi } = payload;
    axios.post(`${process.env.JNE_BASE_URL}/tracing/api/list/v1/cnote/${resi}`, qs.stringify({
      username: process.env.JNE_USERNAME,
      api_key: process.env.JNE_APIKEY,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then((response) => {
      resolve(response?.data);
    }).catch((error) => {
      resolve({ error: error?.message || 'Something Wrong' });
    });
  } catch (error) {
    reject(error);
  }
});

const cancel = (payload) => new Promise((resolve, reject) => {
  const { resi, pic } = payload;
  axios.post(`${process.env.JNE_BASE_URL_CANCEL}/order/cancel`, qs.stringify({
    username: process.env.JNE_USERNAME,
    api_key: process.env.JNE_APIKEY,
    cnote_no: resi,
    pic_cancel: pic,
    reason_cancel: 'Penjual ingin membatalkannya',
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    if (!response?.data?.status) {
      reject(new Error(response?.data?.reason || 'Something Wrong'));
      return;
    }

    resolve({
      status: true,
      message: 'OK',
    });
  }).catch((error) => {
    reject(new Error(error?.response?.data?.error?.reason || error?.message || 'Something Wrong'));
  });
});



module.exports = {
  getOrigin,
  getDestination,
  checkPrice,
  createOrder,
  tracking,
  cancel,
  parameter,
};
