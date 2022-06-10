// validator
const LoginValidator = require('../../validators/seller/auth/login-validator');
const RegisterValidator = require('../../validators/seller/auth/register-validator');
const SocialValidator = require('../../validators/seller/auth/social-validator');
const ForgotPasswordValidator = require('../../validators/seller/auth/forgot-password-validator');
const ResetValidator = require('../../validators/seller/auth/reset-validator');
const ActivateEmailValidator = require('../../validators/seller/auth/activate-validator');

// responses
const LoginResponse = require('../../responses/seller/auth/login-response');
const RegisterResponse = require('../../responses/seller/auth/register-response');
const SocialResponse = require('../../responses/seller/auth/social-response');
const ForgotPasswordResponse = require('../../responses/seller/auth/forgot-password-response');
const ResetResponse = require('../../responses/seller/auth/reset-response');
const ActivateEmailResponse = require('../../responses/seller/auth/activate-response');

module.exports = {
  register: async (request, response, next) => {
    try {
      await RegisterValidator(request.body);

      const result = await new RegisterResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (request, response, next) => {
    try {
      await LoginValidator(request.body);

      const result = await new LoginResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  activateEmail: async (request, response, next) => {
    try {
      await ActivateEmailValidator(request.query);

      const result = await new ActivateEmailResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  social: async (request, response, next) => {
    try {
      await SocialValidator(request.params);

      const result = await new SocialResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  forgotPassword: async (request, response, next) => {
    try {
      await ForgotPasswordValidator(request.body);

      const result = await new ForgotPasswordResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  reset: async (request, response, next) => {
    try {
      await ResetValidator(request.params);

      const result = await new ResetResponse({ request });

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
