const UserIndexResponse = require('../../responses/admin/user/user-index-response');
const UserDetailResponse = require('../../responses/admin/user/user-detail-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      const result = await new UserIndexResponse({ request });

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
      const result = await new UserDetailResponse({ request });

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
