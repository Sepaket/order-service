const httpErrors = require('http-errors');
const { Notification, sequelize } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.notification = Notification;
    return this.process();
  }

  async process() {
    const { params } = this.request;
    const dbTransaction = await sequelize.transaction();

    try {
      await this.notification.destroy(
        { where: { id: params.id } },
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
