const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Insurance } = require('../../../models');

module.exports = class {
  constructor() {
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    return new Promise((resolve, reject) => {
      Insurance.findAll().then((response) => {
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
