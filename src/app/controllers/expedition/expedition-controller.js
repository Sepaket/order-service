// validator
const CheckPriceValidator = require('../../validators/expedition/check-price-validator');

// responses
const CheckPriceResponse = require('../../responses/expedition/check-price-response');

module.exports = {
  checkPrice: async (request, response, next) => {
    try {
      await CheckPriceValidator(request.body);

      const result = await new CheckPriceResponse({ request });

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
