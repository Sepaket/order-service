// validator
const SingleOrderValidator = require('../../validators/expedition/order/single-order-validator');
const MultipleOrderValidator = require('../../validators/expedition/order/multiple-order-validator');

// responses
const JneSingleOrderResponse = require('../../responses/expedition/order/single-order/jne-order-response');
const JneMultipleOrderResponse = require('../../responses/expedition/order/multiple-order/jne-order-response');
const SicepatSingleOrderResponse = require('../../responses/expedition/order/single-order/sicepat-order-response');
const SicepatMultipleOrderResponse = require('../../responses/expedition/order/multiple-order/sicepat-order-response');
const NinjaSingleOrderResponse = require('../../responses/expedition/order/single-order/ninja-order-response');

module.exports = {
  singleOrder: async (request, response, next) => {
    try {
      let result = null;
      const { body } = request;
      await SingleOrderValidator(request);

      if (body.type === 'JNE') result = await new JneSingleOrderResponse({ request });
      if (body.type === 'SICEPAT') result = await new SicepatSingleOrderResponse({ request });
      if (body.type === 'NINJA') result = await new NinjaSingleOrderResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  multipleOrder: async (request, response, next) => {
    try {
      let result = null;
      const { body } = request;
      await MultipleOrderValidator(request);

      if (body.type === 'JNE') result = await new JneMultipleOrderResponse({ request });
      if (body.type === 'SICEPAT') result = await new SicepatMultipleOrderResponse({ request });
      // if (body.type === 'NINJA') result = await new NinjaSingleOrderResponse({ request });

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
