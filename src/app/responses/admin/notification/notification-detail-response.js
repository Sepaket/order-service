const httpErrors = require('http-errors');
const { Notification } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.notification = Notification;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      const { params } = this.request;

      this.notification.findOne({
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
      }).then((response) => {
        const result = this.converter.objectToSnakeCase(
          JSON.parse(JSON.stringify(response)),
        );

        if (response) resolve(result);
        else reject(httpErrors(404, 'No Data Found', { data: null }));
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
