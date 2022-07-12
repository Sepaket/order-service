const WaitingFormPickupReponse = require('../../responses/seller/report/seller-report-waiting-for-pickup');
const CodProcessingReponse = require('../../responses/seller/report/seller-report-cod-processing');

module.exports = {
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
};
