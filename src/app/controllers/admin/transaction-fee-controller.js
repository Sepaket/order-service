const TransactionFeeIndexResponse = require('../../responses/admin/trasaction-fee/trasaction-fee-index-response');
const TransactionFeeUpdateResponse = require('../../responses/admin/trasaction-fee/trasaction-fee-update-response');

const TransactionFeeUpdateValidator = require('../../validators/admin/trasaction-fee/transaction-fee-update-validator');

module.exports = {
  index: async (request, response, next) => {
    try {
      const result = await new TransactionFeeIndexResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (request, response, next) => {
    try {
      await TransactionFeeUpdateValidator(request.body);

      const result = await new TransactionFeeUpdateResponse({ request });

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
