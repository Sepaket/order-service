// validator
const UpdateProfileValidator = require('../../validators/seller/profile/update-profile-validator');
const ChangePasswordValidator = require('../../validators/seller/profile/change-password-validator');
const UpdatePaymentValidator = require('../../validators/seller/profile/update-payment-validator');

// responses
const ProfileResponse = require('../../responses/seller/profile/profile-response');
const UpdateProfileResponse = require('../../responses/seller/profile/update-profile-response');
const ChangePasswordResponse = require('../../responses/seller/profile/change-password-response');
const UpdatePaymentResponse = require('../../responses/seller/profile/update-payment-response');

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

  changePassword: async (request, response, next) => {
    try {
      await ChangePasswordValidator(request.body);

      const result = await new ChangePasswordResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  updatePaymentMethod: async (request, response, next) => {
    try {
      await UpdatePaymentValidator(request.body);

      await new UpdatePaymentResponse({ request });
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
