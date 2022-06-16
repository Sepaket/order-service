// validator
const AddressCreateValidator = require('../../validators/seller/address/create-address-validator');
const AddressShowValidator = require('../../validators/seller/address/show-address-validator');

// responses
const AddressIndexResponse = require('../../responses/seller/address/index-response');
const AddressCreateResponse = require('../../responses/seller/address/create-response');
const AddressShowResponse = require('../../responses/seller/address/show-response');

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

  show: async (request, response, next) => {
    try {
      await AddressShowValidator(request);

      const result = await new AddressShowResponse({ request });

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
