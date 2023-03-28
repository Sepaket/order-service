const OrderTotalChartValidator = require('../../validators/seller/report/order-total-chart-validator');

const TotalOrderReponse = require('../../responses/seller/report/seller-report-total-order');
const WaitingFormPickupReponse = require('../../responses/seller/report/seller-report-waiting-for-pickup');
const DashboardStats = require('../../responses/seller/report/seller-report-dashboard-stats');
const CodProcessingTotalReponse = require('../../responses/seller/report/seller-report-cod-processing-total');
const CodProcessingReponse = require('../../responses/seller/report/seller-report-cod-processing');
const NonCodProcessingReponse = require('../../responses/seller/report/seller-report-non-cod-processing');
const NonCodProcessingTotalReponse = require('../../responses/seller/report/seller-report-non-cod-processing-total');
const PercentageProcessingReponse = require('../../responses/seller/report/seller-report-percentage-processing');
const CodSentReponse = require('../../responses/seller/report/seller-report-cod-sent');
const CodSentTotalReponse = require('../../responses/seller/report/seller-report-cod-sent-total');
const NonCodSentReponse = require('../../responses/seller/report/seller-report-non-cod-sent');
const NonCodSentTotalReponse = require('../../responses/seller/report/seller-report-non-cod-sent-total');
const CodTotalReponse = require('../../responses/seller/report/seller-report-cod-total');
const ReturnToSellerReponse = require('../../responses/seller/report/seller-report-return-to-seller');
const NeedAttentionReponse = require('../../responses/seller/report/seller-report-need-attention');
const RateReturReponse = require('../../responses/seller/report/seller-report-rate-retur');
const RateSuccessReponse = require('../../responses/seller/report/seller-report-rate-success');
const OrderTotalChartReponse = require('../../responses/seller/report/seller-report-order-total-chart');

const TopupPaidReponse = require('../../responses/seller/report/seller-report-topup-paid');
const WithdrawCompletedReponse = require('../../responses/seller/report/seller-report-withdraw-completed');
const CodShippingPaid = require('../../responses/seller/report/seller-report-cod-shipping-paid');
const NonCodShippingPaid = require('../../responses/seller/report/seller-report-non-cod-shipping-paid');
const MutasiValidator = require('../../validators/seller/order/mutasi');

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

  dashboardStats: async (request, response, next) => {
    try {
      const result = await new DashboardStats({ request });

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

  codProcessingTotal: async (request, response, next) => {
    try {
      const result = await new CodProcessingTotalReponse({ request });

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
      await MutasiValidator(request.query);
      const result = await new NonCodProcessingReponse({ request });
      const resultCount = result.length;
      response.send({
        code: 200,
        message: 'OK',
        count : resultCount,
        data: resultCount,
        items : result,
      });
    } catch (error) {
      next(error);
    }
  },

  nonCodProcessingTotal: async (request, response, next) => {
    try {
      const result = await new NonCodProcessingTotalReponse({ request });
      // const resultCount = result.length;
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
      await MutasiValidator(request.query);
      const result = await new CodSentReponse({ request });
      // const resultCount = result.length;
      response.send({
        code: 200,
        message: 'OK',
        data: result,
        // count : resultCount,
        // data: resultCount,
        // items : result,
      });
    } catch (error) {
      next(error);
    }
  },

  codSentTotal: async (request, response, next) => {
    try {
      // await MutasiValidator(request.query);
      const result = await new CodSentTotalReponse({ request });
      // const resultCount = result.length;
      response.send({
        code: 200,
        message: 'OK',
        data: result,
        // count : resultCount,
        // data: resultCount,
        // items : result,
      });
    } catch (error) {
      next(error);
    }
  },

  codTotal: async (request, response, next) => {
    try {
      console.log('cod TOTAL response');
      await MutasiValidator(request.query);
      const result = await new CodTotalReponse({ request });
      // const resultCount = result.length;
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
      await MutasiValidator(request.query);
      const result = await new NonCodSentReponse({ request });
      const resultCount = result.length;
      response.send({
        code: 200,
        message: 'OK',
        count : resultCount,
        data: resultCount,
        items : result,
      });
    } catch (error) {
      next(error);
    }
  },

  nonCodSentTotal: async (request, response, next) => {
    try {
      // await MutasiValidator(request.query);
      const result = await new NonCodSentTotalReponse({ request });
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

  needAttention: async (request, response, next) => {
    try {
      const result = await new NeedAttentionReponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  rateRetur: async (request, response, next) => {
    try {
      const result = await new RateReturReponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  rateSuccess: async (request, response, next) => {
    try {
      const result = await new RateSuccessReponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  orderTotalChart: async (request, response, next) => {
    try {
      await OrderTotalChartValidator(request.query);

      const result = await new OrderTotalChartReponse({ request });

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
      console.log('cod processing');
      await MutasiValidator(request.query);
      const result = await new CodProcessingReponse({ request });
      // const resultCount = result.length;
      response.send({
        code: 200,
        message: 'OK',
        data: result,
        // count : resultCount,
        // data: resultCount,
        // items : result,
      });
    } catch (error) {
      next(error);
    }
  },


  // codProcessing: async (request, response, next) => {
  //   try {
  //     const result = await new CodProcessingReponse({ request });
  //
  //     response.send({
  //       code: 200,
  //       message: 'OK',
  //       data: result,
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // },

  topupPaid: async (request, response, next) => {
    console.log("top up paid");
    try {
      const result = await new TopupPaidReponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        count: result.length,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  withdrawCompleted: async (request, response, next) => {
    console.log("withdrawCompleted");
    try {
      const result = await new WithdrawCompletedReponse({ request });
      console.log(result);
      response.send({
        code: 200,
        message: 'OK',
        count: result.length,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },


  codShippingPaid: async (request, response, next) => {
    console.log('CodShippingPaid');
    try {
      const result = await new CodShippingPaid({ request });
      console.log(result);
      response.send({
        code: 200,
        message: 'OK',
        count: result.length,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  nonCodShippingPaid: async (request, response, next) => {
    console.log('NonCodShippingPaid');
    try {
      const result = await new NonCodShippingPaid({ request });
      console.log(result);
      response.send({
        code: 200,
        message: 'OK',
        count: result.length,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },



};
