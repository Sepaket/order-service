const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { expeditionService } = require('../../../../constant/status');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    return new Promise((resolve, reject) => {
      try {
        const result = this.converter.arrayToSnakeCase(expeditionService);

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
