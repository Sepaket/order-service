// validator
const RegisterValidator = require('../../validators/seller/auth/register-validator');

// responses
const RegisterResponse = require('../../responses/seller/auth/register-response');

module.exports = {
  index: async (request, response, next) => {
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
};
