const SellerCreateValidator = require('../../validators/admin/seller/seller-create-validator');
const SellerDeleteValidator = require('../../validators/admin/seller/seller-delete-validator');
const SellerUpdateBalanceValidator = require('../../validators/admin/seller/seller-update-balance-validator');
const SellerSetSpecialRateValidator = require('../../validators/admin/seller/seller-set-special-rate-validator');
const SellerResetSpecialRateValidator = require('../../validators/admin/seller/seller-reset-special-rate-validator');
const SellerSpecialRateValidator = require('../../validators/admin/seller/seller-special-rate-validator');

const SellerIndexResponse = require('../../responses/admin/seller/seller-index-response');
const SellerDetailResponse = require('../../responses/admin/seller/seller-detail-response');
const SellerCreateResponse = require('../../responses/admin/seller/seller-create-response');
const SellerDeleteResponse = require('../../responses/admin/seller/seller-delete-response');
const SellerUpdateBalanceResponse = require('../../responses/admin/seller/seller-update-balance-response');
const SellerSetSpecialPriceResponse = require('../../responses/admin/seller/seller-set-special-rate-response');
const SellerResetSpecialPriceResponse = require('../../responses/admin/seller/seller-reset-special-rate-response');
const SellerSpecialPriceResponse = require('../../responses/admin/seller/seller-special-rate-response');
const SellerGenerateReferralCodeResponse = require('../../responses/admin/seller/seller-generate-referral-code-response');
const SellerSetReferralCodeResponse = require('../../responses/admin/seller/seller-set-referral-code-response');
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

  specialRate: async (request, response, next) => {
    try {
      await SellerSpecialRateValidator(request.query);
      const result = await new SellerSpecialPriceResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  setSpecialRate: async (request, response, next) => {
    try {
      await SellerSetSpecialRateValidator(request.body);
      const result = await new SellerSetSpecialPriceResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  resetSpecialRate: async (request, response, next) => {
    try {
      await SellerResetSpecialRateValidator(request.body);
      const result = await new SellerResetSpecialPriceResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  generateReferralCode: async (request, response, next) => {
    try {
      // await SellerDeleteValidator(request.params);
      const result = await new SellerGenerateReferralCodeResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
  setReferralCode: async (request, response, next) => {
    try {
      // await SellerDeleteValidator(request.params);
      const result = await new SellerSetReferralCodeResponse({ request });

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
