const axios = require('axios');
const moment = require('moment');
const shortid = require('shortid-36');
const qs = require('querystring');
const CryptoJS = require('crypto-js');
const { Location } = require('../app/models');
require('dotenv').config();

const caseConverter = ({ parameter }) => {
  // eslint-disable-next-line no-unused-vars
  const { body } = this.request;

  return Object.keys(parameter).reduce((accumulator, key) => {
    accumulator[key.toUpperCase()] = parameter[key];
    return accumulator;
  }, {});
};

const SDKClient = require('@lalamove/lalamove-js');

const sdkClient = new SDKClient.ClientModule(
  new SDKClient.Config(
    process.env.LALAMOVE_APIKEY,
    process.env.LALAMOVE_APISECRET,
    process.env.LALAMOVE_API_ENVIRONMENT
  ),
);

String.prototype.escapeSpecialCharsInJSONString = function () {
  // return this .replace(/[\\]/g, '\\\\')
  //   .replace(/[\"]/g, '\\\"')
  //   .replace(/[\/]/g, '\\/')
  //   .replace(/[\b]/g, '\\b')
  //   .replace(/[\f]/g, '\\f')
  //   .replace(/[\n]/g, '\\n')
  //   .replace(/[\r]/g, '\\r')
  //   .replace(/[\t]/g, '\\t');

  return this.replace(/[\\]/g, '\\\\')
    .replace(/[\"]/g, '\\\"')
    .replace(/[\/]/g, '\\/')
    .replace(/[\b]/g, ' ')
    .replace(/[\f]/g, ' ')
    .replace(/[\n]/g, ' ')
    .replace(/[\r]/g, ' ')
    .replace(/[\t]/g, ' ');
};

const payloadFormatter = (payload) =>
// eslint-disable-next-line no-unused-vars
// payload['GOODS_DESC'] = payload['GOODS_DESC'].replace(/\n/gi, " ");
// payload['PICKUP_ADDRESS'] = payload['PICKUP_ADDRESS'].replace(/\n/gi, " ");
// payload['RECEIVER_ADDR1'] = payload['RECEIVER_ADDR1'].replace(/\n/gi, " ");
// payload['SPECIAL_INS'] = payload['SPECIAL_INS'].replace(/\n/gi, " ");

// payload['PICKUP_ADDRESS'] = payload['PICKUP_ADDRESS'].escapeSpecialCharsInJSONString();
// payload['PICKUP_PIC'] = payload['PICKUP_PIC'].escapeSpecialCharsInJSONString();
// payload['PICKUP_NAME'] = payload['PICKUP_NAME'].escapeSpecialCharsInJSONString();
// payload['SHIPPER_NAME'] = payload['SHIPPER_NAME'].escapeSpecialCharsInJSONString();
// payload['SHIPPER_CONTACT'] = payload['SHIPPER_CONTACT'].escapeSpecialCharsInJSONString();
// payload['SHIPPER_ADDR1'] = payload['SHIPPER_ADDR1'].escapeSpecialCharsInJSONString();
// payload['SHIPPER_ADDR2'] = payload['SHIPPER_ADDR2'].escapeSpecialCharsInJSONString();
// payload['SHIPPER_ADDR3'] = payload['SHIPPER_ADDR3'].escapeSpecialCharsInJSONString();
//
// payload['RECEIVER_NAME'] = payload['RECEIVER_NAME'].escapeSpecialCharsInJSONString();
// payload['RECEIVER_ADDR1'] = payload['RECEIVER_ADDR1'].escapeSpecialCharsInJSONString();
// payload['RECEIVER_ADDR2'] = payload['RECEIVER_ADDR2'].escapeSpecialCharsInJSONString();
// payload['RECEIVER_ADDR3'] = payload['RECEIVER_ADDR3'].escapeSpecialCharsInJSONString();
// payload['RECEIVER_CONTACT'] = payload['RECEIVER_CONTACT'].escapeSpecialCharsInJSONString();
// payload['GOODS_DESC'] = payload['GOODS_DESC'].escapeSpecialCharsInJSONString();
// payload['PICKUP_ADDRESS'] = payload['PICKUP_ADDRESS'].escapeSpecialCharsInJSONString();
// payload['RECEIVER_ADDR1'] = payload['RECEIVER_ADDR1'].escapeSpecialCharsInJSONString();
// payload['SPECIAL_INS'] = payload['SPECIAL_INS'].escapeSpecialCharsInJSONString();

  // console.log(`payload formatter goods desc ${payload.GOODS_DESC}`);
  ({ data: payload });
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
      shipper_addr1: payload.sellerAddress?.address || '',
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

const getCity = (payload) => new Promise(async (resolve) => {
  try {
    const res = await sdkGetCity();

    resolve(res);
  } catch (error) {
    console.log(`this is error: ${error}`);
    resolve({
      status: false,
      message: error?.message || 'Something Wrong',
    });
  }
});
const getService = (payload) => new Promise(async (resolve) => {
  try {
    // console.log('payload : ', payload)
    const res = await sdkGetService(payload);
    resolve(res);
  } catch (error) {
    console.log(`this is error: ${error}`);
    resolve({
      status: false,
      message: error?.message || 'Something Wrong',
    });
  }
});

const checkPrice = (payload) => new Promise((resolve) => {
  const {
    origin,
    destination,
    weight,
  } = payload;

  try {
    // console.log('test sdk');
    // testsdk();
    // console.log('test sdk finish');

    const payloadFormatted = payloadFormatter(payload);
    const payloadStringify = qs.stringify({
      // username: process.env.JNE_USERNAME,
      // api_key: process.env.JNE_APIKEY,
      ...payloadFormatted,
    });

    const SECRET = process.env.LALAMOVE_APISECRET;
    const API_KEY = process.env.LALAMOVE_APIKEY;

    const time = new Date().getTime().toString();
    const method = 'POST';
    const path = '/v3/quotations';
    const body = JSON.stringify(payload);
    console.log('lalamove payload from db : ', body);
    const rawSignature = `${time}\r\n${method}\r\n${path}\r\n\r\n${body}`;
    console.log('rawSignature : ', rawSignature);
    const SIGNATURE = CryptoJS.HmacSHA256(rawSignature, SECRET).toString();
    const LALATOKEN = `${API_KEY}:${time}:${SIGNATURE}`;
    console.log('token : ', LALATOKEN);

    console.log('payload string : ', payloadStringify);
    // const payloadObj = payloadStringify.replace(/\n/gi, ' ');
    const auth = `hmac ${LALATOKEN}`;
    // const auth2 = 'hmac 914c9e52e6414d9494e299708d176a41:1545880607433:5133946c6a0ba25932cc18fa3aa1b5c3dfa2c7f99de0f8599b28c2da88ed9d42';
    console.log(auth);
    axios.post(`${process.env.LALAMOVE_BASE_URL}/v3/quotations`, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
        // 'Request-ID': '213131',
        Market: 'ID',
      },
    }).then((response) => {
      console.log('inside axios : ', response.data);
      if (response.data.status === false) {
        console.log('error : '.response.data.error);
      }
      if (!response?.data?.detail) {
        resolve({
          status: false,
          message: response?.data?.error || 'Something Wrong',
        });
        return;
      }

      const status = (response.data.detail[0].status).toLowerCase();
      if (status === 'error') {
        console.log('error');
        resolve({
          status: false,
          message: response.data.detail[0].reason,
        });
        return;
      }
      resolve({
        status: true,
        message: response,
      });
    }).catch((error) => {
      console.log(`this is error 1: ${error}`);
      console.log(`this is error 1 detail: ${error.response.data.error}`);
      resolve({
        status: false,
        message: error?.response?.data?.reason || error?.message || 'Something Wrong',
      });
    });
  } catch (error) {
    console.log(`this is error 2: ${error}`);
    resolve({
      status: false,
      message: error?.message || 'Something Wrong',
    });
  }
});

const createOrder = (payload) => new Promise((resolve) => {
  try {
    // console.log('test sdk');
    // testsdk();
    // console.log('test sdk finish');

    const payloadFormatted = payloadFormatter(payload);
    const payloadStringify = qs.stringify({
      // username: process.env.JNE_USERNAME,
      // api_key: process.env.JNE_APIKEY,
      ...payloadFormatted,
    });
    // console.log('lalamove payload : ',payload)
    const SECRET = process.env.LALAMOVE_APISECRET;
    const API_KEY = process.env.LALAMOVE_APIKEY;

    const time = new Date().getTime().toString();
    const method = 'POST';
    const path = '/v3/quotations';
    // const tes = '{"data":{"serviceType":"MOTORCYCLE","specialRequests":["DOOR_TO_DOOR"],"language":"en_ID","stops":[{"coordinates":{"lat":"-6.278963","lng":"106.814267"},"address":"Jl Benda 70, Cilandak Timur, Jakarta selatan"},{"coordinates":{"lat":"-6.273184","lng":"106.839068"},"address":"RS Siaga, Pejaten"}],"isRouteOptimized":false,"item":{"quantity":"12","weight":"LESS_THAN_3_KG","categories":["FOOD_DELIVERY","OFFICE_ITEM"],"handlingInstructions":["KEEP_UPRIGHT"]}}}';
    const body = JSON.stringify(payload);
    // console.log('lalamove tes payload in JSON : ',tes)
    console.log('lalamove payload from db : ', body);
    const rawSignature = `${time}\r\n${method}\r\n${path}\r\n\r\n${body}`;
    console.log('rawSignature : ', rawSignature);
    const SIGNATURE = CryptoJS.HmacSHA256(rawSignature, SECRET).toString();
    const LALATOKEN = `${API_KEY}:${time}:${SIGNATURE}`;
    console.log('token : ', LALATOKEN);

    console.log('payload string : ', payloadStringify);
    // const payloadObj = payloadStringify.replace(/\n/gi, ' ');
    const auth = `hmac ${LALATOKEN}`;
    // const auth2 = 'hmac 914c9e52e6414d9494e299708d176a41:1545880607433:5133946c6a0ba25932cc18fa3aa1b5c3dfa2c7f99de0f8599b28c2da88ed9d42';
    console.log(auth);
    axios.post(`${process.env.LALAMOVE_BASE_URL}/v3/quotations`, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
        // 'Request-ID': '213131',
        Market: 'ID',
      },
    }).then((response) => {
      console.log('inside axios : ', response.data);
      if (response.data.status === false) {
        console.log('error : '.response.data.error);
      }
      if (!response?.data?.detail) {
        resolve({
          status: false,
          message: response?.data?.error || 'Something Wrong',
        });
        return;
      }

      const status = (response.data.detail[0].status).toLowerCase();
      if (status === 'error') {
        console.log('error');
        resolve({
          status: false,
          message: response.data.detail[0].reason,
        });
        return;
      }
      resolve({
        status: true,
        message: response,
      });
    }).catch((error) => {
      console.log(`this is error 1: ${error}`);
      console.log(`this is error 1 detail: ${error.response.data.error}`);
      resolve({
        status: false,
        message: error?.response?.data?.reason || error?.message || 'Something Wrong',
      });
    });
  } catch (error) {
    console.log(`this is error 2: ${error}`);
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

const sdkGetQuotation = () => new Promise(async (resolve, reject) => {
  const co = {
    lat: '-6.278963',
    lng: '106.814267',
  };

  const co2 = {
    lat: '-6.273184',
    lng: '106.839068',
  };

  const stop1 = {
    coordinates: co,
    address: 'benda 70',
  };

  const stop2 = {
    coordinates: co2,
    address: 'rs siaga',
  };

  const quotationPayload = SDKClient.QuotationPayloadBuilder.quotationPayload()
    .withLanguage('en_ID')
    .withServiceType('MOTORCYCLE')
    .withStops([stop1, stop2])
    .build();

  const res = await sdkClient.Quotation.create('ID', quotationPayload);
  console.log('res : ', res);
  return res;
});

const sdkGetCity = () => new Promise(async (resolve, reject) => {
  try {
    const res = await sdkClient.Market.retrieve('ID');

    resolve(res);
  } catch (error) {
    reject(error);
  }
});

const sdkGetService = (payload) => new Promise(async (resolve, reject) => {
  try {
    const res = await sdkClient.City.retrieve('ID', payload);
    // console.log('res : ', res);
    resolve(res);
  } catch (error) {
    reject(error);
  }
});

const sdkOrder = (payload, payload2) => new Promise(async (resolve, reject) => {
  try {
    // console.log('sdkOrder all : ', payload2);
    // console.log('sdkOrder : ', payload.id);
    const orderPayload = SDKClient.OrderPayloadBuilder.orderPayload()
      .withIsPODEnabled(true)
      .withQuotationID(payload.id)
      .withSender({
        stopId: payload.stops[0].id,
        name: payload2.sender_name,
        phone: payload2.sender_phone,
      })
      .withRecipients([
        {
          stopId: payload.stops[1].id,
          name: payload2.recipient_name,
          phone: payload2.recipient_phone,
        },
      ])
      .withMetadata({
        internalId: '123123',
      })
      .build();
    // console.log('before sending order ');
    const res = await sdkClient.Order.create('ID', orderPayload);

    // console.log('LALA ORDER : ', res);
    // const res = await sdkClient.Market.retrieve('ID');

    resolve(res);
  } catch (error) {
    reject(error);
  }
});

const sdkQuotation = (payload) => new Promise(async (resolve, reject) => {
  try {
    // console.log('sdkQuotation : ', payload.order_items[0].stops);

    const stops = [];
    const payload_stops = payload.order_items[0].stops;

    // console.log('sdkQuotation : ', payload_stops);

    for (const s in payload_stops) {
      stops.push(payload_stops[s]);
    }

    const date1 = new Date(payload.schedule_at);
    var offset = date1.getTimezoneOffset()
    var offset_date = date1 + "-" + offset + ":00";
  console.log('duration : ', offset_date);
    const items = {
      quantity: '3',
      weight: 'LESS_THAN_3KG',
      categories: ['FOOD_DELIVERY', 'OFFICE_ITEM8'],
      handlingInstructions: ['KEEP_UPRIGHT'],
    };
    // console.log('payload schedule : ', payload);
    const quotationPayload = await SDKClient.QuotationPayloadBuilder.quotationPayload()
      .withLanguage('en_ID')
      .withServiceType(payload.service_code)
      .withScheduleAt(payload.schedule_at)
      .withSpecialRequests(payload.special_requests)
      .withIsRouteOptimized(true)
      .withStops(stops)
      // .withItem(items)
      .build();
    console.log('after quotation payload builder : ', quotationPayload)
    const res = await sdkClient.Quotation.create('ID', quotationPayload);
    resolve(res);
  } catch (error) {
    reject(error);
  }
});

const retrieveQuotation = (payload) => new Promise(async (resolve, reject) => {
  try {
    const res = await sdkClient.Quotation.retrieve('ID', payload);
    resolve(res);
  } catch (error) {
    reject(error);
  }
});

const retrieveOrder = (payload) => new Promise(async (resolve, reject) => {
  try {
    const res = await sdkClient.Order.retrieve('ID', payload);
    resolve(res);
  } catch (error) {
    reject(error);
  }
});

const validate = (payload) => new Promise(async (resolve, reject) => {
  try {
    const error = [];
    const {
      shippingCharge,
      codCondition,
      creditCondition,
      weight,
    } = payload;
    console.log('lalamove validator ');

    if (payload.ongkirminuscod < 0) {
      error.push({ message: 'Ongkir lebih besar dari COD value' });
    }
    if (!payload.is_cod && !creditCondition) error.push({ message: 'Saldo anda tidak cukup untuk melakukan pengiriman non COD' });
    if (payload.is_cod && !payload.cod_value) error.push({ message: 'COD Value harus diisi untuk tipe COD' });
    if (!payload.is_cod && !payload.goods_amount) error.push({ message: 'Goods Amount harus diisi untuk tipe non COD' });
    if (!weight || weight === null || weight === '') error.push({ message: 'Berat harus di isi dan minimal 1 KG' });
    if (await required(payload?.is_cod)) error.push({ message: 'Metode pengiriman harus diisi 1 atau 0' });
    if (await required(payload?.sender_name)) error.push({ message: 'Nama pengirim harus diisi' });
    if (await required(payload?.sender_phone)) error.push({ message: 'No. Telepon pengirim harus diisi' });
    if (await required(payload?.receiver_name)) error.push({ message: 'Nama penerima harus diisi' });
    if (await required(payload?.receiver_phone)) error.push({ message: 'No. Telepon tujuan harus diisi' });
    if (await required(payload?.receiver_address)) error.push({ message: 'Alamat tujuan harus diisi' });
    if (await required(payload?.receiver_location_id)) error.push({ message: 'Alamat Detail tujuan harus diisi' });
    if (await required(payload?.goods_content)) error.push({ message: 'Isi paket harus diisi' });
    if (await required(payload?.goods_category)) error.push({ message: 'Jenis pengiriman harus diisi' });
    if (await required(payload?.goods_qty)) error.push({ message: 'Jumlah/pcs harus diisi' });
    if (await required(payload?.is_insurance)) error.push({ message: 'Asuransi harus diisi 1 atau 0' });
    if (payload?.goods_qty?.toString()?.length > 5) error.push({ message: 'Jumlah/pcs maksimum 5 digit' });

    if (await isExist({ param: payload?.receiver_location_id, identifier: 'id', model: Location })) {
      error.push({ message: 'Alamat tujuan yang anda pilih tidak ditemukan' });
    }

    if (!await required(payload?.is_cod) && payload.is_cod && await required(payload.cod_value)) {
      error.push({ message: 'Nilai COD harus diisi ketika anda memilih metode pengiriman COD' });

      if (parseFloat(payload.cod_value) >= 5000000) error.push({ message: 'Nilai COD maximal Rp. 5.000.000' });
      if (parseFloat(payload.cod_value) <= 10000) error.push({ message: 'Nilai COD minimal Rp. 10.000' });
    }

    if (
      !await required(payload?.is_cod)
      && !payload.is_cod
      && await required(payload.goods_amount)
    ) {
      error.push({ message: 'Nilai barang harus diisi ketika anda memilih metode pengiriman Non COD' });

      if (parseFloat(payload.goods_amount) >= 5000000) error.push({ message: 'Nilai barang maximal Rp. 5.000.000' });
      if (parseFloat(payload.goods_amount) <= 10000) error.push({ message: 'Nilai barang minimal Rp. 10.000' });
    }
    resolve(error);
  } catch (error) {
    reject(error);
  }
});

module.exports = {
  getOrigin,
  getDestination,
  checkPrice,
  createOrder,
  tracking,
  cancel,
  parameter,
  validate,
  getCity,
  getService,
  sdkOrder,
  sdkQuotation,
  retrieveQuotation,
  retrieveOrder,
};
