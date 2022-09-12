const moment = require('moment');
const httpErrors = require('http-errors');
const { NotificationRead, sequelize } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.reader = NotificationRead;
    return this.process();
  }

  async process() {
    const dbTransaction = await sequelize.transaction();

    try {
      this.seller = await jwtSelector({ request: this.request });
      const parameterMapper = await this.mapper();

      await this.reader.create(
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
    const { params } = this.request;

    return {
      id: `${moment().format('Ymdss')}${moment().valueOf().toString().substring(0, 4)}`,
      sellerId: this.seller.id,
      notificationId: params.id,
    };
  }
};
