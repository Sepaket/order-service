const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { TransactionFee, Insurance, Discount } = require('../../../models');
const tax = require('../../../../constant/tax');

module.exports = class {
  constructor({ request }) {
    this.fee = TransactionFee;
    this.insurance = Insurance;
    this.discount = Discount;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    try {
      const trxFee = await this.fee.findOne();
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
          'maximum_order',
          'minimum_order',
        ],
      });

      return {
        cod_fee: {
          value: trxFee?.codFee || 0,
          type: trxFee?.codFeeType || 'PERCENTAGE',
        },
        vat: {
          value: tax.vat,
          type: tax.vatType,
        },
        discount: discounts || [],
        insurance: insurances || [],
      };
    } catch (error) {
      throw new Error(error?.message);
    }
  }
};
