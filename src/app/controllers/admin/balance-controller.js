const TotalBalanceResponse = require('../../responses/admin/balance/total-balance-response');
const BalanceHistoryResponse = require('../../responses/admin/balance/history-balance-response');
const OrderHistoryResponse = require('../../responses/admin/balance/history-order-response');
const CombinedHistoryResponse = require('../../responses/admin/balance/combined-history-response');

module.exports = {
  totalBalance: async (request, response, next) => {
    try {
      const result = await new TotalBalanceResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  balanceHistory: async (request, response, next) => {
    try {
      const result = await new BalanceHistoryResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  orderHistory: async (request, response, next) => {
    try {
      const result = await new OrderHistoryResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  combinedHistory: async (request, response, next) => {
    try {
      const result = await new CombinedHistoryResponse({ request });

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
