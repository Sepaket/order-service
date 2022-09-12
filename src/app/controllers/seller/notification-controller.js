// validator
const NotificationReadValidator = require('../../validators/seller/payment/withdraw-validator');

// responses
const NotificationResponse = require('../../responses/seller/notification/notification-list-response');
const WithdrawResponse = require('../../responses/seller/payment/withdraw-response');

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
      await NotificationReadValidator(request.body);

      const result = await new WithdrawResponse({ request });

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
