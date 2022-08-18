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
          const undefinedId = body.ids.find((id) => id === 0);
          if (!undefinedId) {
            mapped[undefinedId] = {
              id: '',
              province: '',
              city: '',
              district: '',
              sub_district: '',
              postal_code: '',
              jne_origin_code: '',
              jne_destination_code: '',
              sicepat_origin_code: '',
              sicepat_destination_code: '',
              ninja_origin_code: '',
              ninja_destination_code: '',
              idexpress_origin_code: '',
              idexpress_destination_code: '',
            };
          }

          result.forEach((item) => {
            const selectedId = body.ids.find((id) => id === item.id);
            if (selectedId) mapped[selectedId] = item;
          });

          resolve(mapped);
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
