// validator
const OrderListValidator = require('../../validators/seller/order/list-validator');
const OrderDetailValidator = require('../../validators/seller/order/detail-validator');

// responses
const OrderListResponse = require('../../responses/seller/order/order-list-response');
const OrderDetailResponse = require('../../responses/seller/order/order-detail-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      await OrderListValidator(request.query);

      const result = await new OrderListResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  detail: async (request, response, next) => {
    try {
      await OrderDetailValidator(request);

      const result = await new OrderDetailResponse({ request });

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
