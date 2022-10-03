// responses
const CategoryListResponse = require('../../responses/general/ticket-category/category-list-response');
const CategoryDetailResponse = require('../../responses/general/ticket-category/category-detail-response');

module.exports = {
  index: async (request, response, next) => {
    try {
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
