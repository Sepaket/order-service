// validator
const LoginValidator = require('../../validators/seller/auth/login-validator');
const PhoneloginValidator = require('../../validators/seller/auth/phonelogin-validator');
const RegisterValidator = require('../../validators/seller/auth/register-validator');
const PhoneRegisterValidator = require('../../validators/seller/auth/phone-register-validator');
const SocialValidator = require('../../validators/seller/auth/social-validator');
const ForgotPasswordValidator = require('../../validators/seller/auth/forgot-password-validator');
const ResetPasswordValidator = require('../../validators/seller/auth/reset-password-validator');
const ActivateEmailValidator = require('../../validators/seller/auth/activate-validator');

// responses
const LoginResponse = require('../../responses/seller/auth/login-response');
const RegisterResponse = require('../../responses/seller/auth/register-response');
const PhoneRegisterResponse = require('../../responses/seller/auth/phone-register-response');
const SocialResponse = require('../../responses/seller/auth/social-response');
const ForgotPasswordResponse = require('../../responses/seller/auth/forgot-password-response');
const ResetPasswordResponse = require('../../responses/seller/auth/reset-password-response');
const ActivateEmailResponse = require('../../responses/seller/auth/activate-response');

const PhoneLoginResponse = require('../../responses/seller/auth/phone-login-response');
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

  phoneregister: async (request, response, next) => {
    try {

      console.log('before phone register validator')
      await PhoneRegisterValidator(request.body);
      console.log('after phone register validator')

      const result = await new PhoneRegisterResponse({ request });

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
      console.log('before login validator');
      await LoginValidator(request.body);
      console.log('after login validator');

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

  phonelogin: async (request, response, next) => {
    try {

      await PhoneloginValidator(request.body);
      console.log('after phone login validator');

      const result = await new PhoneLoginResponse({ request });

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

  resetPassword: async (request, response, next) => {
    try {
      await ResetPasswordValidator(request.body);

      const result = await new ResetPasswordResponse({ request });

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
