const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Admin } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.admin = Admin;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const { params } = this.request;

    return new Promise((resolve, reject) => {
      this.admin.findOne({
        attributes: [
          'id',
          'name',
          'email',
          'phone',
          'role',
        ],
        where: { id: params.id },
      }).then((response) => {
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
