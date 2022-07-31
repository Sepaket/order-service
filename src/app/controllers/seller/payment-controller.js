// validator
const TopupValidator = require('../../validators/seller/payment/topup-validator');

// responses
const TopupResponse = require('../../responses/seller/payment/topup-response');

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
};
