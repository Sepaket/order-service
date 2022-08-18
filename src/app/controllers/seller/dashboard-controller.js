const CodTotalValidator = require('../../validators/seller/dashboard/cod-total-validator');
const CodTotalResponse = require('../../responses/seller/dashboard/cod-total-response');
const CurrentDiscountResponse = require('../../responses/seller/dashboard/current-discount-response');

module.exports = {
  codTotal: async (request, response, next) => {
    try {
      await CodTotalValidator(request.query);

      const result = await new CodTotalResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  currentDiscount: async (request, response, next) => {
    try {
      const result = await new CurrentDiscountResponse({ request });

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
