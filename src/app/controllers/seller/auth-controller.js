// validator
const LoginValidator = require('../../validators/seller/auth/login-validator');
const RegisterValidator = require('../../validators/seller/auth/register-validator');
const SocialValidator = require('../../validators/seller/auth/social-validator');
const ForgotValidator = require('../../validators/seller/auth/forgot-validator');
const ResetValidator = require('../../validators/seller/auth/reset-validator');

// responses
const LoginResponse = require('../../responses/seller/auth/login-response');
const RegisterResponse = require('../../responses/seller/auth/register-response');
const SocialResponse = require('../../responses/seller/auth/social-response');
const ForgotResponse = require('../../responses/seller/auth/forgot-response');
const ResetResponse = require('../../responses/seller/auth/reset-response');

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

  social: async (request, response, next) => {
    try {
      await SocialValidator(request.body);

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

  forgot: async (request, response, next) => {
    try {
      await ForgotValidator(request.params);

      const result = await new ForgotResponse({ request });

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
