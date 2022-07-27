// const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Admin, Seller, SellerDetail } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.admin = Admin;
    this.seller = Seller;
    this.request = request;
    this.sellerDetail = SellerDetail;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const limit = 10;
    const offset = 0;
    const { query } = this.request;
    const nextPage = (
      (parseInt(query.page, 10) - parseInt(1, 10)) * parseInt(10, 10)
    ) || parseInt(offset, 10);
    const total = await this.seller.count();

    return new Promise((resolve, reject) => {
      this.seller.findAll({
        attributes: [
          'id',
          'name',
          'email',
        ],
        include: [
          {
            attributes: [
              ['id', 'seller_detail_id'],
              'credit',
            ],
            model: this.sellerDetail,
            as: 'sellerDetail',
            required: true,
          },
        ],
        order: [['id', 'DESC']],
        limit: parseInt(query.limit, 10) || parseInt(limit, 10),
        offset: nextPage,
      }).then((response) => {
        const result = this.converter.arrayToSnakeCase(
          JSON.parse(JSON.stringify(response)),
        );

        if (result.length > 0) {
          resolve({
            data: result,
            meta: {
              total,
              total_result: result.length,
              limit: parseInt(query.limit, 10) || limit,
              page: parseInt(query.page, 10) || (offset + 1),
            },
          });
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
