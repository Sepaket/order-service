// const httpErrors = require('http-errors');

const tax = require('../../../../constant/tax');
const lalamove = require('../../../../helpers/lalamove');
const { idxServiceStatus } = require('../../../../constant/status');
const jwtSelector = require('../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { formatCurrency } = require('../../../../helpers/currency-converter');
const {
  Location,
  Discount,
  SellerDetail,
  TransactionFee,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.jne = jne;
    this.tax = tax;
    this.ninja = ninja;
    this.sap = sap;
    this.request = request;
    this.sicepat = sicepat;
    this.location = Location;
    this.discount = Discount;
    this.fee = TransactionFee;
    this.seller = SellerDetail;
    this.idexpress = idexpress;
    this.converter = snakeCaseConverter;
    return this.process();
  }


  process() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('inside chack lalamove price response');
        let result = [];
        const { body } = this.request;
        resolve({
          data: result,
          meta: null,
        });
      } catch (error) {
        reject(error);
      }
    });
  }



};
