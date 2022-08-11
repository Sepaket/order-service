// validator
const BulkOrderValidator = require('../../validators/expedition/order/bulk-order-validator');
const OrderDraftValidator = require('../../validators/expedition/order/order-draft-validator');
const CommonOrderValidator = require('../../validators/expedition/order/common-order-validator');

// responses
const OrderResponse = require('../../responses/expedition/order/order-response');
const OrderDraft = require('../../responses/expedition/order/order-draft-response');
const BulkOrderResponse = require('../../responses/expedition/order/bulk-order-response');
const TransactionFeeResponse = require('../../responses/expedition/order/transaction-fee-response');

module.exports = {
  commonOrder: async (request, response, next) => {
    try {
      await CommonOrderValidator(request);

      const result = await new OrderResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  bulkOrder: async (request, response, next) => {
    try {
      await BulkOrderValidator(request);

      const result = await new BulkOrderResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  transactionFee: async (request, response, next) => {
    try {
      const result = await new TransactionFeeResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  draftOrder: async (request, response, next) => {
    try {
      await OrderDraftValidator(request);

      const result = await new OrderDraft({ request });

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
