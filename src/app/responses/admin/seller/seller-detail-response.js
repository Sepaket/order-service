const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Admin, Seller, SellerDetail } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.admin = Admin;
    this.seller = Seller;
    this.sellerDetail = SellerDetail;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const { params } = this.request;

    return new Promise((resolve, reject) => {
      this.seller.findOne({
        attributes: [
          'id',
          'name',
          'email',
          'phone',
        ],
        where: { id: params.id },
        include: [
          {
            attributes: [
              ['id', 'seller_detail_id'],
              'credit',
              'photo',
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

        result.seller_detail.credit = parseFloat(result.seller_detail.credit) || 0;

        if (response) resolve(result);
        else reject(httpErrors(404, 'No Data Found', { data: null }));
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
