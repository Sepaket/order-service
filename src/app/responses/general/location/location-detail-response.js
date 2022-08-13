const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { Location } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.op = Sequelize.Op;
    this.request = request;
    this.location = Location;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const search = this.querySearch();

    return new Promise((resolve, reject) => {
      try {
        const { body } = this.request;
        this.location.findAll({
          where: search,
        }).then((response) => {
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          const mapped = {};
          result.forEach((item) => {
            const selectedId = body.ids.find((id) => id === item.id);
            if (selectedId) mapped[selectedId] = item;

            return result;
          });

          if (result.length > 0) {
            resolve(mapped);
          } else {
            reject(httpErrors(404, 'No Data Found', []));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  querySearch() {
    const { body } = this.request;
    return {
      id: {
        [this.op.in]: body.ids,
      },
    };
  }
};
