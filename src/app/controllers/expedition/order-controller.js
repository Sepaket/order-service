// validator
const BulkOrderValidator = require('../../validators/expedition/order/bulk-order-validator');
const OrderDraftValidator = require('../../validators/expedition/order/order-draft-validator');
const CommonOrderValidator = require('../../validators/expedition/order/common-order-validator');

// responses
const OrderResponse = require('../../responses/expedition/order/order-response');
const OrderDraft = require('../../responses/expedition/order/order-draft-response');
const BulkOrderResponse = require('../../responses/expedition/order/bulk-order-response');
const TransactionFeeResponse = require('../../responses/expedition/order/transaction-fee-response');
const NinjaCallbackResponse = require('../../responses/expedition/order/ninja-callback-response');

module.exports = {
  commonOrder: async (request, response, next) => {
    try {
      // console.log(request);
      await CommonOrderValidator(request);
      const result = await new OrderResponse({ request });
      // console.log(result);
      // console.log(result.logs.failed_log.errors);
      // console.log('result : ' + result);
      console.log(JSON.stringify(result, null, 2));
      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      console.log("error - validator - reno ");
      next(error);
    }
  },

    bulkOrder: async (request, response, next) => {
    try {
      await BulkOrderValidator(request);

      var success = '';
      var [result, successCount, failCount] = await new BulkOrderResponse({ request });
      console.log(result);
      //if result ada error kirim return
      // response.send({
      //   code: 200,
      //   message: 'OK',
      //   data: result,
      //   info : {
      //     success : successCount,
      //     fail : failCount,
      //   },
      // });
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

  ninjaCallback: async (request, response, next) => {
    try {
      const result = await new NinjaCallbackResponse({ request });

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
