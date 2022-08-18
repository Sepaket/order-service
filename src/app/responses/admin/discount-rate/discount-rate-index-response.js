const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Discount } = require('../../../models');

module.exports = class {
  constructor() {
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    return new Promise((resolve, reject) => {
      Discount.findAll().then((response) => {
        const result = this.converter.arrayToSnakeCase(
          JSON.parse(JSON.stringify(response)),
        );

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
