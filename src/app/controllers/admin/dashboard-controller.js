const CodTotalResponse = require('../../responses/admin/dashboard/cod-total-response');
const DeliveredResponse = require('../../responses/admin/dashboard/delivered-response');
const NonDeliveredResponse = require('../../responses/admin/dashboard/non-delivered-response');
const ProblemResponse = require('../../responses/admin/dashboard/problem-response');

module.exports = {
  codTotal: async (request, response, next) => {
    try {
      const result = await new CodTotalResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  delivered: async (request, response, next) => {
    try {
      const result = await new DeliveredResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  nonDelivered: async (request, response, next) => {
    try {
      const result = await new NonDeliveredResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  problem: async (request, response, next) => {
    try {
      const result = await new ProblemResponse({ request });

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
