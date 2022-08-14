const ProfileResponse = require('../../responses/admin/profile-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      const result = await new ProfileResponse({ request });

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
