const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { serviceCode } = require('../../../../constant/status');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    return new Promise((resolve, reject) => {
      try {
        const { params } = this.request;
        const result = serviceCode[params.type]
          .find((item) => item.code.toLowerCase() === params.code.toLowerCase());

        if (!result) reject(httpErrors(400, 'Your selected code is invalid', { data: null }));

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }
};
