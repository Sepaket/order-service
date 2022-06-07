// validator
const ListValidator = require('../../validators/general/faq/list-validator');
const DetailValidator = require('../../validators/general/faq/detail-validator');

// responses
const FaqListResponse = require('../../responses/general/faq/faq-list-response');
const FaqDetailResponse = require('../../responses/general/faq/faq-detail-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      await ListValidator(request.query);

      const result = await new FaqListResponse({ request });

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

      const result = await new FaqDetailResponse({ request });

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
