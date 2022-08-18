const UserCreateValidator = require('../../validators/admin/user/user-create-validator');
const UserDeleteValidator = require('../../validators/admin/user/user-delete-validator');

const UserIndexResponse = require('../../responses/admin/user/user-index-response');
const UserDetailResponse = require('../../responses/admin/user/user-detail-response');
const UserCreateResponse = require('../../responses/admin/user/user-create-response');
const UserDeleteResponse = require('../../responses/admin/user/user-delete-response');

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

  create: async (request, response, next) => {
    try {
      await UserCreateValidator(request.body);

      const result = await new UserCreateResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (request, response, next) => {
    try {
      await UserDeleteValidator(request.params);
      const result = await new UserDeleteResponse({ request });

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
