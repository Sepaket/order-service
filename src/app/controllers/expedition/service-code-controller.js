// validator
const ListValidator = require('../../validators/expedition/service-code/list-validator');
const DetailValidator = require('../../validators/expedition/service-code/detail-validator');

// responses
const ServiceCodeResponse = require('../../responses/expedition/service-code/service-code-list-response');
const ServiceCodeDetailResponse = require('../../responses/expedition/service-code/service-code-detail-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      await ListValidator(request.params);

      const result = await new ServiceCodeResponse({ request });

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
      await DetailValidator(request.params);

      const result = await new ServiceCodeDetailResponse({ request });

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
