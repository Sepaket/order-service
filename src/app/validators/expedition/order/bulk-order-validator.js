const joi = require('joi');
const moment = require('moment');
const excelReader = require('read-excel-file/node');
const util = require('util');
const { SellerAddress } = require('../../../models');
const { serviceCode } = require('../../../../constant/status');
const { formatCurrency } = require('../../../../helpers/currency-converter');

let request = null;
const isExist = async ({ params, identifier, model }) => new Promise((resolve, reject) => {
  model.findOne({
    where: { [`${identifier}`]: params },
  }).then((result) => {
    if (!result) reject(new Error(`This ${identifier.split('_').join(' ')} does not exist`));
    else resolve(true);
  }).catch((error) => {
    reject(error.message);
  });
});

const fileValidator = async () => new Promise((resolve, reject) => {
  console.log('enter fle validator ')
  const { body } = request;
  let addressCheck = true;
  let isError = false;
  const error = [];
  let errorString = '';
  const fileName = body.file.split('/public/');
  // reject(new Error('This file code does not exist'));
  const minLength = 4;
  const maxLength = 5;
  if (!fileName[1]) reject(new Error('This filename does not exist'));
  // else resolve(true);
  //  const dataOrders = excelReader(`public/${fileName[1]}`);
  const dataOrders = {};
  excelReader(`public/${fileName[1]}`).then((rows) => {
    rows.map(async (item, index) => {
      if (index !== 0) {
        const excelData = {
          receiverName: item[0],
          receiverPhone: item[1],
          receiverAddress: item[2],
          receiverAddressNote: item[3],
          receiverAddressDistrict: item[4],
          receiverAddressSubDistrict: item[5],
          receiverAddressPostalCode: item[6],
          weight: item[7],
          volume: item[8],
          goodsAmount: item[9],
          codValue: item[10],
          goodsContent: item[11],
          goodsQty: item[12],
          isInsurance: item[13],
          note: item[14],
          isCod: !!((item[10] && item[10] !== '' && item[10] !== 0) || item[10] !== null),
        };
        console.log('length : ' + excelData.receiverAddress.length);
        if (excelData.receiverAddress.length < minLength) {
          errorString += 'Address is too short. ';
          // reject(new Error('Address is too short'));
          addressCheck = false;
          isError = true;
        } else if (excelData.receiverAddress.length > maxLength){
          // reject(new Error('Address is too long'));
          errorString += 'Address is too long. ';
          addressCheck = false;
          isError = true;
        }



      }
    });
    if (isError) {
      console.log('is error')
      reject(new Error(errorString))
    } else {
      resolve(true)
    }

  });

});

const serviceCodeValidator = async () => new Promise((resolve, reject) => {
  const { body } = request;
  const exist = serviceCode[body.type]?.find((item) => item.code === body.service_code);
  if (exist) resolve(true);
  else reject(new Error('This service code does not exist'));
});

const validator = joi.object({
  type: joi.string().required().valid('JNE', 'SICEPAT', 'NINJA', 'IDEXPRESS'),
  service_code: joi
    .string()
    .required()
    .external(() => serviceCodeValidator()),
  should_pickup_with: joi.string().required().valid('MOTOR', 'MOBIL', 'TRUCK'),
  pickup_date: joi.date().min(moment().format('YYYY-MM-DD')).required(),
  pickup_time: joi.string().regex(/^([0-9]{2}):([0-9]{2})$/)
    .message({ 'string.pattern.base': 'pickup time format should HH:mm,' })
    .required(),
  seller_location_id: joi
    .number()
    .min(1)
    .required()
    .external((req) => isExist({ params: req, identifier: 'id', model: SellerAddress })),
  file: joi.string().required(),
    // .external(() => fileValidator()), -- BELUM DIGUNAKAN. BELUM TAHU APA SAJA YG DIVALIDASI DI FILE
});

module.exports = (object) => {
  request = object;
  // console.log('call bulk validator')
  return validator.validateAsync(object.body, {
    errors: {
      wrap: {
        label: '',
      },
    },
    abortEarly: false,
  });
};
