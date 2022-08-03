// validator
const AddressListValidator = require('../../validators/seller/address/list-validator');
const AddressDetailValidator = require('../../validators/seller/address/detail-validator');
const AddressCreateValidator = require('../../validators/seller/address/create-validator');
const AddressUpdateValidator = require('../../validators/seller/address/update-validator');

// responses
const AddressListResponse = require('../../responses/seller/address/address-list-response');
const AddressDetailResponse = require('../../responses/seller/address/address-detail-response');
const AddressCreateResponse = require('../../responses/seller/address/address-create-response');
const AddressUpdateResponse = require('../../responses/seller/address/address-update-response');
const AddressDeleteResponse = require('../../responses/seller/address/address-delete-response');
const AddressToggleHideResponse = require('../../responses/seller/address/address-toggle-hide-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      await AddressListValidator(request.query);

      const result = await new AddressListResponse({ request });

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

  detail: async (request, response, next) => {
    try {
      await AddressDetailValidator(request);

      const result = await new AddressDetailResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (request, response, next) => {
    try {
      await AddressUpdateValidator(request);
      await AddressDetailValidator(request);

      await new AddressUpdateResponse({ request });
      const result = await new AddressDetailResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (request, response, next) => {
    try {
      await AddressDetailValidator(request);

      const result = await new AddressDeleteResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  toggleHide: async (request, response, next) => {
    try {
      await AddressDetailValidator(request);

      await new AddressToggleHideResponse({ request });
      const result = await new AddressDetailResponse({ request });

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
