const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { categories } = require('../../../../constant/ticket');

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
        const result = categories.find((item) => item.id === parseInt(params.id, 10));

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }
};
