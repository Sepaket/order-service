// validator
const OrderTrackingValidator = require('../../validators/expedition/tracking/tracking-validator');

// responses
const OrderTrackingResponse = require('../../responses/expedition/tracking/tracking-response');

module.exports = async (request, response, next) => {
  try {
    await OrderTrackingValidator(request.body);

    const result = await new OrderTrackingResponse({ request });

    response.send({
      code: 200,
      message: 'OK',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
