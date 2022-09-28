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
        const { query } = this.request;
        const result = categories.filter((item) => {
          if (item.content.toLowerCase().includes(query.keyword.toLowerCase())) {
            return item;
          }

          return null;
        }).filter((item) => item);

        resolve(query?.keyword ? result : categories);
      } catch (error) {
        reject(error);
      }
    });
  }
};
