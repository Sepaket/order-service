const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { Notification, NotificationRead } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.op = Sequelize.Op;
    this.request = request;
    this.read = NotificationRead;
    this.notification = Notification;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const seller = await jwtSelector({ request: this.request });

    return new Promise((resolve, reject) => {
      try {
        this.notification.findAll({
          attributes: [
            ['id', 'notification_id'],
            'title',
            'message',
            'type',
            'startDate',
            'endDate',
          ],
        }).then(async (response) => {
          const result = await this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          const reads = await this.read.findAll({
            where: { sellerId: seller.id },
          });

          const filtered = result?.filter((item) => {
            const getNotifByRead = reads.find(
              (reader) => reader.notificationId === item.notification_id,
            );
            if (getNotifByRead) return null;
            return item;
          }) || [];

          if (filtered.length > 0) {
            resolve(filtered);
          } else {
            reject(httpErrors(404, 'No Data Found', { data: [] }));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
};
