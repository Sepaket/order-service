const httpErrors = require('http-errors');
const { Discount, sequelize } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.discount = Discount;
    return this.process();
  }

  async process() {
    const dbTransaction = await sequelize.transaction();
    try {
      const { body } = this.request;

      if (body.new.length) {
        await this.createNew(body.new, dbTransaction);
      }

      if (body.update.length) {
        await this.update(body.update, dbTransaction);
      }

      if (body.delete.length) {
        await this.delete(body.delete, dbTransaction);
      }

      dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }

  async createNew(data, dbTransaction) {
    // eslint-disable-next-line no-restricted-syntax
    for (const dt of data) {
      // eslint-disable-next-line no-await-in-loop
      await this.discount.create({
        value: dt.value,
        type: dt.type,
        minimum_order: dt.minimum_order,
        maximum_order: dt.maximum_order,
      }, { transaction: dbTransaction });
    }
  }

  async update(data, dbTransaction) {
    // eslint-disable-next-line no-restricted-syntax
    for (const dt of data) {
      // eslint-disable-next-line no-await-in-loop
      await this.discount.update({
        value: dt.value,
        type: dt.type,
        minimum_order: dt.minimum_order,
        maximum_order: dt.maximum_order,
      }, { where: { id: dt.id }, transaction: dbTransaction });
    }
  }

  async delete(data, dbTransaction) {
    await this.discount.destroy({ where: { id: data }, transaction: dbTransaction });
  }
};
