const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Seller, Bank, SellerDetail } = require('../../../models');
const role = require('../../../../constant/role');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.bank = Bank;
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
          'socialId',
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
            include: [
              {
                model: this.bank,
                as: 'bank',
                required: false,
              },
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

        const { credit } = result.seller_detail;
        result.seller_detail.role = role.SELLER.text;
        result.seller_detail.is_login_socmed = !!(result.social_id !== 'NULL' && result.social_id);
        result.seller_detail.credit = Number.isNaN(parseFloat(credit)) ? 0 : credit;

        delete result.social_id;

        if (response) resolve(result);
        else reject(httpErrors(404, 'No Data Found', { data: null }));
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
