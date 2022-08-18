const tax = require('../../../../constant/tax');
const jwtSelector = require('../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const {
  TransactionFee,
  Insurance,
  Discount,
  SellerDetail,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.fee = TransactionFee;
    this.insurance = Insurance;
    this.discount = Discount;
    this.seller = SellerDetail;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    try {
      const trxFee = await this.fee.findOne();
      const sellerId = await jwtSelector({ request: this.request });
      const seller = await this.seller.findOne({
        where: { sellerId: sellerId.id },
      });

      const insurances = await this.insurance.findAll({
        attributes: [
          ['id', 'insurance_id'],
          'expedition',
          'insurance_value',
          'insurance_value_type',
          'admin_fee',
          'admin_fee_type',
        ],
      });

      const discounts = await this.discount.findAll({
        attributes: [
          ['id', 'discount_id'],
          'value',
          'type',
          'maximumOrder',
          'minimumOrder',
        ],
      });

      const discountMap = seller?.discount > 0
        ? [{
          specific_seller: true,
          type: seller.discountType,
          value: seller.discount,
          minimum_order: null,
          maximum_order: null,
        }] : discounts?.map((item) => ({
          specific_seller: false,
          type: item.type,
          value: item.value,
          minimum_order: item.minimumOrder,
          maximum_order: item.maximumOrder,
        }));

      return {
        cod_fee: {
          value: trxFee?.codFee || 0,
          type: trxFee?.codFeeType || 'PERCENTAGE',
        },
        vat: {
          value: tax.vat,
          type: tax.vatType,
        },
        discount: discountMap || [],
        insurance: insurances || [],
      };
    } catch (error) {
      throw new Error(error?.message);
    }
  }
};
