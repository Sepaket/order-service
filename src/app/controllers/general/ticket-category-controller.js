// validator
const CategoryListValidator = require('../../validators/general/ticket-category/list-validator');
const CategoryDetailValidator = require('../../validators/general/ticket-category/detail-validator');

// responses
const CategoryListResponse = require('../../responses/general/ticket-category/category-list-response');
const CategoryDetailResponse = require('../../responses/general/ticket-category/category-detail-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      await CategoryListValidator(request.query);

      const result = await new CategoryListResponse({ request });

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
      await CategoryDetailValidator(request.params);

      const result = await new CategoryDetailResponse({ request });

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
