// validator
const CommonOrderValidator = require('../../validators/expedition/order/common-order-validator');
const BulkOrderValidator = require('../../validators/expedition/order/bulk-order-validator');

// responses
const JneCommonOrderResponse = require('../../responses/expedition/order/common-order/jne-order-response');
const SicepatCommonOrderResponse = require('../../responses/expedition/order/common-order/sicepat-order-response');
const NinjaCommonOrderResponse = require('../../responses/expedition/order/common-order/ninja-order-response');
const JneBulkOrderResponse = require('../../responses/expedition/order/bulk-order/jne-order-response');
const SicepatBulkOrderResponse = require('../../responses/expedition/order/bulk-order/sicepat-order-response');
const NinjaBulkOrderResponse = require('../../responses/expedition/order/bulk-order/ninja-order-response');
const TransactionFeeResponse = require('../../responses/expedition/order/transaction-fee/transaction-fee-response');

module.exports = {
  commonOrder: async (request, response, next) => {
    try {
      let result = null;
      const { body } = request;
      await CommonOrderValidator(request);

      if (body.type === 'JNE') result = await new JneCommonOrderResponse({ request });
      if (body.type === 'SICEPAT') result = await new SicepatCommonOrderResponse({ request });
      if (body.type === 'NINJA') result = await new NinjaCommonOrderResponse({ request });

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
      let result = null;
      const { body } = request;
      await BulkOrderValidator(request);

      if (body.type === 'JNE') result = await new JneBulkOrderResponse({ request });
      if (body.type === 'SICEPAT') result = await new SicepatBulkOrderResponse({ request });
      if (body.type === 'NINJA') result = await new NinjaBulkOrderResponse({ request });

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
};
