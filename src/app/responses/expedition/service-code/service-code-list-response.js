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
        const result = serviceCode[params.type];

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
