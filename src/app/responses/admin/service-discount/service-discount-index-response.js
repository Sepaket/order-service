const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { ServiceDiscount } = require('../../../models');

module.exports = class {
  constructor() {
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    return new Promise((resolve, reject) => {
      // console.log('process 0');
      ServiceDiscount.findAll().then((response) => {
        // console.log('process 1');
        const result = this.converter.arrayToSnakeCase(
          JSON.parse(JSON.stringify(response)),
        );
        // console.log('process 2 :', response);
        if (result) {
          resolve(result);
        }

        resolve(null);
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
