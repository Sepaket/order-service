const httpErrors = require('http-errors');
const { Notification, sequelize } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.notification = Notification;
    return this.process();
  }

  async process() {
    const dbTransaction = await sequelize.transaction();

    try {
      const parameterMapper = await this.mapper();

      await this.notification.create(
        { ...parameterMapper },
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }

  async mapper() {
    const { body } = this.request;

    return {
      title: body.title,
      message: body.message,
      isDraft: body.is_draft,
      startDate: body.start_date,
      endDate: body.end_date,
    };
  }
};
