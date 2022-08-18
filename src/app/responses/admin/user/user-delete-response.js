const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Admin, sequelize } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.admin = Admin;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const { params } = this.request;
    const dbTransaction = await sequelize.transaction();

    try {
      await this.admin.destroy({
        where: { id: params.id },
      }, { transaction: dbTransaction });

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
