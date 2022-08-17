const { Sequelize } = require('sequelize');
const { SellerDetail, Discount } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.op = Sequelize.Op;
    return this.process();
  }

  async process() {
    return new Promise((resolve, reject) => {
      try {
        this.getDiscountFromSeller()
          .then((res) => {
            if (!res.discount || parseFloat(res.discount) <= 0) {
              this.getDiscountFromGlobal()
                .then((result) => {
                  if (!result) resolve(0);
                  resolve(result);
                }).catch((err) => reject(err));
            } else {
              resolve(res);
            }
          })
          .catch((error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  }

  async getDiscountFromSeller() {
    const seller = await jwtSelector({ request: this.request });
    return SellerDetail.findOne({
      attributes: [
        'discount',
        'discount_type',
      ],
      where: {
        seller_id: { [this.op.eq]: seller.id },
      },
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getDiscountFromGlobal() {
    return Discount.findOne({
      attributes: [
        ['value', 'discount'],
        ['type', 'discount_type'],
      ],
    });
  }
};
