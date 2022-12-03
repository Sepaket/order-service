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
  const { body } = request;
  let addressCheck = true;
  const fileName = body.file.split('/public/');
  // reject(new Error('This file code does not exist'));
  const minLength = 10;
  const maxLength = 200;
  console.log('file validator');
  // console.log(fileName);
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
          receiverAddressSubDistrict: item[4],
          receiverAddressPostalCode: item[5],
          weight: item[6],
          volume: item[7],
          goodsAmount: item[8],
          codValue: item[9],
          goodsContent: item[10],
          goodsQty: item[11],
          isInsurance: item[12],
          note: item[13],
          isCod: !!((item[9] && item[9] !== '' && item[9] !== 0) || item[9] !== null),
        };
        // console.log(excelData.receiverAddress.length);
        if (excelData.receiverAddress.length < minLength) {
          // console.log("address too short");
          reject(new Error('Address is too short'));
          addressCheck = false;
        } else if (excelData.receiverAddress.length > maxLength){
          reject(new Error('Address is too long'));
          addressCheck = false;
        } else {
          resolve(true);
        }

        // if (!addressCheck) {
        //   reject(new Error('Address is too short'));
        // } else {
        //   resolve(true);
        // }
      }
    });
  });

});

const serviceCodeValidator = async () => new Promise((resolve, reject) => {
  console.log('SC validator');
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
  // .external(() => fileValidator()),
});

module.exports = (object) => {
  request = object;
  return validator.validateAsync(object.body, {
    errors: {
      wrap: {
        label: '',
      },
    },
  });
};
