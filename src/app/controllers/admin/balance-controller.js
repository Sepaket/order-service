const TotalBalanceResponse = require('../../responses/admin/balance/total-balance-response');

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
};
