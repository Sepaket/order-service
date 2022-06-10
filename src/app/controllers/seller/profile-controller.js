// validator
const UpdateProfileValidator = require('../../validators/seller/profile/update-profile-validator');

// responses
const ProfileResponse = require('../../responses/seller/profile/profile-response');
const UpdateProfileResponse = require('../../responses/seller/profile/update-profile-response');

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

  update: async (request, response, next) => {
    try {
      await UpdateProfileValidator(request.body);

      await new UpdateProfileResponse({ request });
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
