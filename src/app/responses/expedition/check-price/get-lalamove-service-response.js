// const httpErrors = require('http-errors');

const tax = require('../../../../constant/tax');
const lalamove = require('../../../../helpers/lalamove');
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

    this.request = request;

    this.location = Location;
    this.discount = Discount;
    this.fee = TransactionFee;
    this.seller = SellerDetail;

    this.converter = snakeCaseConverter;
    return this.process();
  }


  process() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('inside chack lalamove CITY response');
        let result = [];
        result = await lalamove.getService();
        console.log(result);
        const { body } = this.request;
        resolve({
          data: result,
          meta: null,
        });
        return result;
      } catch (error) {
        reject(error);
      }
    });
  }



};
