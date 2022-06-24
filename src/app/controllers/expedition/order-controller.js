// validator
const SingleOrderValidator = require('../../validators/expedition/order/create-order-validator');

// responses
const JneSingleOrderResponse = require('../../responses/expedition/order/single-order/jne-order-response');
const SicepatSingleOrderResponse = require('../../responses/expedition/order/single-order/sicepat-order-response');

module.exports = {
  singleOrder: async (request, response, next) => {
    try {
      let result = null;
      const { body } = request;
      await SingleOrderValidator(request);

      if (body.type === 'JNE') result = await new JneSingleOrderResponse({ request });
      if (body.type === 'SICEPAT') result = await new SicepatSingleOrderResponse({ request });

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
