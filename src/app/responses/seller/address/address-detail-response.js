const httpErrors = require('http-errors');
const { SellerAddress, Location } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.location = Location;
    this.address = SellerAddress;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      const { params } = this.request;
      const seller = await jwtSelector({ request: this.request });

      this.address.findOne({
        attributes: [
          ['id', 'address_id'],
          'name',
          'pic_name',
          'pic_phone_number',
          'address',
          'hideInResi',
          'active',
        ],
        where: {
          id: params.id,
          sellerId: seller.id,
        },
        include: [
          {
            model: this.location,
            as: 'location',
            required: false,
            attributes: [
              ['id', 'location_id'],
              'province',
              'city',
              'district',
              'subDistrict',
              'postalCode',
            ],
          },
        ],
      }).then((response) => {
        const result = this.converter.objectToSnakeCase(
          JSON.parse(JSON.stringify(response)),
        );

        result.location = this.converter.objectToSnakeCase(result.location);

        if (response) resolve(result);
        else reject(httpErrors(404, 'No Data Found', { data: null }));
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
