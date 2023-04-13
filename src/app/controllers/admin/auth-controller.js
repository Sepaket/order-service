// validator
const LoginValidator = require('../../validators/admin/auth/login-validator');

// responses
const LoginResponse = require('../../responses/admin/auth/login-response');
const shortid = require('shortid-36');

module.exports = {
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

  getreferralcode: async (request, response, next) => {
    try {
const result = shortid.generate();

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
