// validator
const LoginValidator = require('../../validators/admin/auth/login-validator');

// responses
const LoginResponse = require('../../responses/admin/auth/login-response');

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
};
