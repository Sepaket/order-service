const CodTotalValidator = require('../../validators/admin/dashboard/cod-total-validator');
const CodTotalResponse = require('../../responses/admin/dashboard/cod-total-response');

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
};
