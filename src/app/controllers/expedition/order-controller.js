// validator
const BulkOrderValidator = require('../../validators/expedition/order/bulk-order-validator');
const OrderDraftValidator = require('../../validators/expedition/order/order-draft-validator');
const CommonOrderValidator = require('../../validators/expedition/order/common-order-validator');
// const GeolocOrderValidator = require('../../validators/expedition/order/geoloc-order-validator');
// const LalamoveOrderValidator = require('../../validators/expedition/order/lalamove-order-validator');

// responses
const OrderResponse = require('../../responses/expedition/order/order-response');
const LalamoveOrderResponse = require('../../responses/expedition/order/lalamove-order-response');
const LalamoveRetrieveOrderResponse = require('../../responses/expedition/order/lalamove-retrieve-order-response');
const LalamoveQuotationResponse = require('../../responses/expedition/order/lalamove-quotation-response');

const LalamoveChangeDriverResponse = require('../../responses/expedition/order/lalamove-change-driver-response');
const LalamoveCancelOrderResponse = require('../../responses/expedition/order/lalamove-cancel-order-response');

const OrderDraft = require('../../responses/expedition/order/order-draft-response');
const BulkOrderResponse = require('../../responses/expedition/order/bulk-order-response');
const TransactionFeeResponse = require('../../responses/expedition/order/transaction-fee-response');
const NinjaCallbackResponse = require('../../responses/expedition/order/ninja-callback-response');
const LalaCallbackResponse = require('../../responses/expedition/order/lala-callback-response');

module.exports = {
  commonOrder: async (request, response, next) => {
    try {
      console.log('common order');
      // console.log(request);
      const { body } = request;
      const specialOrderArr = ['LALAMOVE'];
      let result;
      if (specialOrderArr.includes(body.type)) {
        console.log('special order');
        await CommonOrderValidator(request);
        result = await new LalamoveOrderResponse({ request });
      } else {
        console.log('not special');
        await CommonOrderValidator(request);
        console.log('after validator');
        result = await new OrderResponse({ request });
      }



      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      console.log(error);
      // console.log("error - validator - reno ");
      next(error);
    }
  },

  lalaQuotation: async (request, response, next) => {
    try {
      console.log('LALA quotation');
      // console.log(request);
      const { body } = request;

      let result;
      // await CommonOrderValidator(request);
      result = await new LalamoveQuotationResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      console.log(error);
      // console.log("error - validator - reno ");
      next(error);
    }
  },

  lalaOrder: async (request, response, next) => {
    try {
      console.log('LALA order');
      // console.log(request);
      const { body } = request;

      let result;
        // await CommonOrderValidator(request);
        result = await new LalamoveOrderResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      console.log(error);
      // console.log("error - validator - reno ");
      next(error);
    }
  },


  getLalaOrder: async (request, response, next) => {
    try {
      console.log('retrieve LALA order');
      // console.log(request);
      const { body } = request;

      let result;
      // await CommonOrderValidator(request);
      result = await new LalamoveRetrieveOrderResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      console.log(error);
      // console.log("error - validator - reno ");
      next(error);
    }
  },



  lalaCancelOrder: async (request, response, next) => {
    try {
      console.log('cancel LALA order');
      let result;
      // await CommonOrderValidator(request);
      result = await new LalamoveCancelOrderResponse({ request });

      if (result) {
        //return saldo user ke wallet
      }
      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      // console.log("error - validator - reno ");
      next(error);
    }
  },

  lalaChangeDriver: async (request, response, next) => {
    try {
      console.log('lala change driver');
      const { body } = request;

      let result;
      // await CommonOrderValidator(request);
      // result = await new LalamoveChangeDriverResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      console.log(error);
      // console.log("error - validator - reno ");
      next(error);
    }
  },



  bulkOrder: async (request, response, next) => {
    try {
      await BulkOrderValidator(request);
      var success = '';
      var [result, successCount, failCount] = await new BulkOrderResponse({ request });
      //if result ada error kirim return
      response.send({
        code: 200,
        message: 'OK',
        data: result,
        info : {
          success : successCount,
          fail : failCount,
        },
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

  lalaCallbackGet: async (request, response, next) => {
    try {
      // const result = await new LalaCallbackResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        // data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  lalaCallback: async (request, response, next) => {
    try {
      const result = await new LalaCallbackResponse({ request });

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
