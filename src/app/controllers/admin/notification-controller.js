// validators
const NotificationListValidator = require('../../validators/admin/notification/list-validator');
const NotificationCreateValidator = require('../../validators/admin/notification/create-validator');
const NotificationUpdateValidator = require('../../validators/admin/notification/update-validator');
const NotificationDetailValidator = require('../../validators/admin/notification/detail-validator');

// responses
const NotificationResponse = require('../../responses/admin/notification/notification-list-response');
const NotificationCreateResponse = require('../../responses/admin/notification/notification-create-response');
const NotificationUpdateResponse = require('../../responses/admin/notification/notification-update-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      await NotificationListValidator(request.query);

      const result = await new NotificationResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (request, response, next) => {
    try {
      await NotificationCreateValidator(request.body);

      const result = await new NotificationCreateResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (request, response, next) => {
    try {
      await NotificationDetailValidator(request.params);
      await NotificationUpdateValidator(request.body);

      const result = await new NotificationUpdateResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
