// validator
const NotificationDetailValidator = require('../../validators/seller/notification/detail-validator');

// responses
const NotificationResponse = require('../../responses/seller/notification/notification-list-response');
const NotificationDetailResponse = require('../../responses/seller/notification/notification-detail-response');

module.exports = {
  index: async (request, response, next) => {
    try {
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

  read: async (request, response, next) => {
    try {
      await NotificationDetailValidator(request.params);

      const result = await new NotificationDetailResponse({ request });

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
