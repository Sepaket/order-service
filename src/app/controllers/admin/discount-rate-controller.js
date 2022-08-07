const DiscountRateIndexResponse = require('../../responses/admin/discount-rate/discount-rate-index-response');
const DiscountRateUpdateResponse = require('../../responses/admin/discount-rate/discount-rate-update-response');

const DiscountRateUpdateValidator = require('../../validators/admin/discount-rate/discount-rate-update-validator');

module.exports = {
  index: async (request, response, next) => {
    try {
      const result = await new DiscountRateIndexResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (request, response, next) => {
    try {
      await DiscountRateUpdateValidator(request.body);

      const result = await new DiscountRateUpdateResponse({ request });

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
