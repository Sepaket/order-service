const WaitingFormPickupReponse = require('../../responses/seller/report/seller-report-waiting-for-pickup');

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
};
