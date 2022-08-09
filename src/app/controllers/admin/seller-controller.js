const SellerCreateValidator = require('../../validators/admin/seller/seller-create-validator');
const SellerDeleteValidator = require('../../validators/admin/seller/seller-delete-validator');
const SellerUpdateBalanceValidator = require('../../validators/admin/seller/seller-update-balance-validator');

const SellerIndexResponse = require('../../responses/admin/seller/seller-index-response');
const SellerDetailResponse = require('../../responses/admin/seller/seller-detail-response');
const SellerCreateResponse = require('../../responses/admin/seller/seller-create-response');
const SellerDeleteResponse = require('../../responses/admin/seller/seller-delete-response');
const SellerUpdateBalanceResponse = require('../../responses/admin/seller/seller-update-balance-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      const result = await new SellerIndexResponse({ request });

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
      const result = await new SellerDetailResponse({ request });

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
      await SellerCreateValidator(request.body);

      const result = await new SellerCreateResponse({ request });

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
      await SellerDeleteValidator(request.params);
      const result = await new SellerDeleteResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  updateBalance: async (request, response, next) => {
    try {
      await SellerUpdateBalanceValidator(request.body);
      const result = await new SellerUpdateBalanceResponse({ request });

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
