const BatchValidator = require('../../validators/admin/order/batch-validator');

const BatchResponse = require('../../responses/admin/order/order-batch-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      await BatchValidator(request.query);

      const result = await new BatchResponse({ request });

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
