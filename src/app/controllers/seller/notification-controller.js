// validator
const NotificationReadValidator = require('../../validators/seller/notification/read-validator');

// responses
const NotificationResponse = require('../../responses/seller/notification/notification-list-response');
const NotificationReadResponse = require('../../responses/seller/notification/notification-read-response');

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
      await NotificationReadValidator(request.params);

      const result = await new NotificationReadResponse({ request });

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
