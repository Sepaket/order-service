// validator
const SingleOrderValidator = require('../../validators/expedition/order/create-order-validator');

// responses
const SingleOrderResponse = require('../../responses/expedition/order/single-order-response');

module.exports = {
  singleOrder: async (request, response, next) => {
    try {
      await SingleOrderValidator(request.body);

      const result = await new SingleOrderResponse({ request });

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
