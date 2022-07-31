// validator
const TopupValidator = require('../../validators/seller/payment/topup-validator');
const ConfirmationValidator = require('../../validators/seller/payment/callback-validator');

// responses
const TopupResponse = require('../../responses/seller/payment/topup-response');
const ConfirmationResponse = require('../../responses/seller/payment/confirmation-response');

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
      await ConfirmationValidator(request.body);

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
};
