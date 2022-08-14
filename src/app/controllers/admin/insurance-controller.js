const InsuranceIndexResponse = require('../../responses/admin/insurance/insurance-index-response');
const InsuranceUpdateResponse = require('../../responses/admin/insurance/insurance-update-response');

const InsuranceUpdateValidator = require('../../validators/admin/insurance/insurance-update-validator');

module.exports = {
  index: async (request, response, next) => {
    try {
      const result = await new InsuranceIndexResponse({ request });

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
      await InsuranceUpdateValidator(request.body);

      const result = await new InsuranceUpdateResponse({ request });

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
