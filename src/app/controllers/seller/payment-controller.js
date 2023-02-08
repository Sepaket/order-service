// validator
const TopupValidator = require('../../validators/seller/payment/topup-validator');
const HistoryValidator = require('../../validators/seller/payment/history-validator');
const SummaryValidator = require('../../validators/seller/payment/summary-validator');
const WithdrawValidator = require('../../validators/seller/payment/withdraw-validator');

// responses
const TopupResponse = require('../../responses/seller/payment/topup-response');
const ConfirmationResponse = require('../../responses/seller/payment/confirmation-response');
const HistoryResponse = require('../../responses/seller/payment/history-response');
const ReferralHistoryResponse = require('../../responses/seller/payment/referral-history-response');
const SummaryResponse = require('../../responses/seller/payment/summary-response');
const WithdrawResponse = require('../../responses/seller/payment/withdraw-response');

module.exports = {
  topup: async (request, response, next) => {
    try {
      await TopupValidator(request.body);

      const result = await new TopupResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  withdraw: async (request, response, next) => {
    try {
      await WithdrawValidator(request.body);

      const result = await new WithdrawResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  callback: async (request, response, next) => {
    try {
      const result = await new ConfirmationResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  history: async (request, response, next) => {
    try {
      await HistoryValidator(request.query);

      const result = await new HistoryResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  referralHistory: async (request, response, next) => {
    try {
      await HistoryValidator(request.query);

      const result = await new ReferralHistoryResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  summary: async (request, response, next) => {
    try {
      await SummaryValidator(request.query);

      const result = await new SummaryResponse({ request });

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
