// validator

// responses
const AddressIndexResponse = require('../../responses/seller/address/index-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      const result = await new AddressIndexResponse({ request });

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
