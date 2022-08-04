// validator
const TopupValidator = require('../../validators/seller/payment/topup-validator');
const HistoryValidator = require('../../validators/seller/payment/history-validator');

// responses
const TopupResponse = require('../../responses/seller/payment/topup-response');
const ConfirmationResponse = require('../../responses/seller/payment/confirmation-response');
const HistoryResponse = require('../../responses/seller/payment/history-response');

module.exports = {
  topup: async (request, response, next) => {
    try {
      await TopupValidator(request.body);

      const result = await new TopupResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  callback: async (request, response, next) => {
    try {
      const result = await new ConfirmationResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  history: async (request, response, next) => {
    try {
      await HistoryValidator(request.query);

      const result = await new HistoryResponse({ request });

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
