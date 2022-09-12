// validators
const NotificationListValidator = require('../../validators/admin/notification/list-validator');
const NotificationCreateValidator = require('../../validators/admin/notification/create-validator');

// responses
const NotificationResponse = require('../../responses/admin/notification/notification-list-response');
const NotificationCreateResponse = require('../../responses/admin/notification/notification-create-response');

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
};
