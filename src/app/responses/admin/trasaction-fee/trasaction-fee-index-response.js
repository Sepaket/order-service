const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { TransactionFee } = require('../../../models');

module.exports = class {
  constructor() {
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    return new Promise((resolve, reject) => {
      TransactionFee.findOne().then((response) => {
        const result = this.converter.objectToSnakeCase(
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
