// validator
const MemberTransactionValidator = require('../../validators/seller/member/list-validator');

// responses
const MemberInfoResponse = require('../../responses/seller/member/member-info-response');
const MemberTransactionResponse = require('../../responses/seller/member/member-transaction-response');

module.exports = {
  info: async (request, response, next) => {
    try {
      const result = await new MemberInfoResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  transaction: async (request, response, next) => {
    try {
      await MemberTransactionValidator(request);

      const result = await new MemberTransactionResponse({ request });

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
