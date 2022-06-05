const httpErrors = require('http-errors');
const { Province } = require('../../../../models');
const snakeCaseConverter = require('../../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.province = Province;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise((resolve, reject) => {
      const { params } = this.request;

      this.province.findOne({ where: { id: params.id } }).then((response) => {
        const result = this.converter.objectToSnakeCase(
          JSON.parse(JSON.stringify(response)),
        );

        if (response) resolve(result);
        else reject(httpErrors(404, 'No Data Found', { data: null }));
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
