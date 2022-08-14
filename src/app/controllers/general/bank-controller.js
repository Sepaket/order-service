// validator
const BankListValidator = require('../../validators/general/bank/list-validator');
const BankDetailValidator = require('../../validators/general/bank/detail-validator');

// responses
const BankListResponse = require('../../responses/general/bank/bank-list-response');
const BankDetailResponse = require('../../responses/general/bank/bank-detail-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      await BankListValidator(request.query);

      const result = await new BankListResponse({ request });

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
      await BankDetailValidator(request.params);

      const result = await new BankDetailResponse({ request });

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
