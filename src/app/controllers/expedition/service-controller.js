// responses
const ServiceResponse = require('../../responses/expedition/service/service-list-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      const result = await new ServiceResponse({ request });

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
