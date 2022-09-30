const moment = require('moment');
const httpErrors = require('http-errors');
const jwtSelector = require('../../../../helpers/jwt-selector');
const { NotificationRead, Notification, sequelize } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.reader = NotificationRead;
    this.notification = Notification;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const dbTransaction = await sequelize.transaction();

    try {
      const { params } = this.request;
      this.seller = await jwtSelector({ request: this.request });
      const parameterMapper = await this.mapper();

      await this.reader.create(
        { ...parameterMapper },
        { transaction: dbTransaction },
      );

      const notification = await this.notification.findOne({
        attributes: [
          ['id', 'notification_id'],
          'title',
          'message',
          'type',
          'startDate',
          'endDate',
          'isDraft',
        ],
        where: { id: params.id },
      });

      const result = this.converter.objectToSnakeCase(
        JSON.parse(JSON.stringify(notification)),
      );

      await dbTransaction.commit();
      return result;
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
