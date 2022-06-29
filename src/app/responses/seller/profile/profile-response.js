const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Seller, SellerDetail } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.sellerDetail = SellerDetail;
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

      this.seller.findOne({
        attributes: [
          ['id', 'seller_id'],
          'name',
          'email',
          'phone',
        ],
        where: { id: decoded.id },
        include: [
          {
            attributes: [
              ['id', 'seller_detail_id'],
              'photo',
              'credit',
              'bankAccountName',
              'bankAccountNumber',
              'referalCode',
            ],
            model: this.sellerDetail,
            as: 'sellerDetail',
            required: true,
          },
        ],
      }).then((response) => {
        const result = this.converter.objectToSnakeCase(
          JSON.parse(JSON.stringify(response)),
        );

        result.seller_detail = this.converter.objectToSnakeCase(
          JSON.parse(JSON.stringify(result.seller_detail)),
        );

        if (response) resolve(result);
        else reject(httpErrors(404, 'No Data Found', { data: null }));
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
