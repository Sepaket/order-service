const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../helpers/snakecase-converter');
const { Admin } = require('../../models');
// const role = require('../../../constant/role');

module.exports = class {
  constructor({ request }) {
    this.admin = Admin;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise((resolve, reject) => {
      const { headers } = this.request;

      const authorizationHeader = headers.authorization;
      const token = authorizationHeader
        .replace(/bearer/gi, '')
        .replace(/ /g, '');

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      this.admin.findOne({
        attributes: [
          'id',
          'name',
          'email',
          'phone',
          'role',
        ],
        where: { id: decoded.id },
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
