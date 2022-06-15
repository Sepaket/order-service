// validator
const AddressCreateValidator = require('../../validators/seller/address/create-address-validator');

// responses
const AddressIndexResponse = require('../../responses/seller/address/index-response');
const AddressCreateResponse = require('../../responses/seller/address/create-response');

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

  create: async (request, response, next) => {
    try {
      await AddressCreateValidator(request);

      const result = await new AddressCreateResponse({ request });

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
