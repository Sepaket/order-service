const TotalOrderReponse = require('../../responses/seller/report/seller-report-total-order');
const WaitingFormPickupReponse = require('../../responses/seller/report/seller-report-waiting-for-pickup');
const CodProcessingReponse = require('../../responses/seller/report/seller-report-cod-processing');
const NonCodProcessingReponse = require('../../responses/seller/report/seller-report-non-cod-processing');
const PercentageProcessingReponse = require('../../responses/seller/report/seller-report-percentage-processing');
const CodSentReponse = require('../../responses/seller/report/seller-report-cod-sent');
const NonCodSentReponse = require('../../responses/seller/report/seller-report-non-cod-sent');
const ReturnToSellerReponse = require('../../responses/seller/report/seller-report-return-to-seller');

module.exports = {
  totalOrder: async (request, response, next) => {
    try {
      const result = await new TotalOrderReponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  waitingForPickup: async (request, response, next) => {
    try {
      const result = await new WaitingFormPickupReponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  codProcessing: async (request, response, next) => {
    try {
      const result = await new CodProcessingReponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  nonCodProcessing: async (request, response, next) => {
    try {
      const result = await new NonCodProcessingReponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  percentageProcessing: async (request, response, next) => {
    try {
      const result = await new PercentageProcessingReponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  codSent: async (request, response, next) => {
    try {
      const result = await new CodSentReponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  nonCodSent: async (request, response, next) => {
    try {
      const result = await new NonCodSentReponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  returnToSeller: async (request, response, next) => {
    try {
      const result = await new ReturnToSellerReponse({ request });

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
