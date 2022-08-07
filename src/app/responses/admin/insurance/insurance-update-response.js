const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Insurance, sequelize } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const dbTransaction = await sequelize.transaction();
    const insurances = await Insurance.findAll({ attributes: ['id', 'expedition'] });

    try {
      const { body } = this.request;
      // eslint-disable-next-line no-restricted-syntax
      for (const item of body) {
        const findInsurance = insurances.find(
          (insurance) => insurance.expedition === item.expedition,
        );

        if (!findInsurance) {
          // eslint-disable-next-line no-await-in-loop
          await Insurance.create(this.itemMpper(item), { transaction: dbTransaction });
        } else {
          // eslint-disable-next-line no-await-in-loop
          await Insurance.update(this.itemMpper(item), {
            where: { id: findInsurance.id },
            transaction: dbTransaction,
          });
        }
      }

      dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }

  // eslint-disable-next-line class-methods-use-this
  itemMpper(item) {
    return {
      expedition: item.expedition,
      insuranceValue: item.insurance_value,
      insuranceValueType: item.insurance_value_type,
      adminFee: item.admin_fee,
      adminFeeType: item.admin_fee_type,
    };
  }
};
