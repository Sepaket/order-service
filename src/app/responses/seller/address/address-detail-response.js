const httpErrors = require('http-errors');
const { SellerAddress } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.address = SellerAddress;
    this.request = request;
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
          'address_detail',
          'active',
        ],
        where: {
          id: params.id,
          sellerId: seller.id,
        },
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
