const httpErrors = require('http-errors');
const { City, Province, District } = require('../../../../models');
const snakeCaseConverter = require('../../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.city = City;
    this.district = District;
    this.province = Province;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise((resolve, reject) => {
      const { params } = this.request;

      this.district.findOne({
        where: { id: params.id },
        include: [
          {
            model: this.province,
            as: 'province',
            required: false,
          },
          {
            model: this.city,
            as: 'city',
            required: false,
          },
        ],
      }).then((response) => {
        const result = this.converter.objectToSnakeCase(
          JSON.parse(JSON.stringify(response)),
        );

        delete result.city_id;
        delete result.province_id;

        if (response) resolve(result);
        else reject(httpErrors(404, 'No Data Found', { data: null }));
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
