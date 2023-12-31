// validator
const BatchValidator = require('../../validators/seller/order/batch-validator');
const OrderListValidator = require('../../validators/seller/order/list-validator');
const MutasiValidator = require('../../validators/seller/order/mutasi');
const OrderDetailValidator = require('../../validators/seller/order/detail-validator');
const ExportValidator = require('../../validators/seller/order/export-validator');
const PrintValidator = require('../../validators/seller/order/print-validator');

// responses
const BatchResponse = require('../../responses/seller/order/order-batch-response');
const OrderListResponse = require('../../responses/seller/order/order-list-response');
const OrderListallResponse = require('../../responses/seller/order/order-listall-response');
const OrderLalaListallResponse = require('../../responses/seller/order/order-lala-listall-response');
const OrderDetailResponse = require('../../responses/seller/order/order-detail-response');
const OrderReturResponse = require('../../responses/seller/order/order-retur-response');
const OrderMutasiResponse = require('../../responses/seller/order/order-mutasi-response');
const ExportResponse = require('../../responses/seller/order/order-export-response');
const PrintResponse = require('../../responses/seller/order/order-print-response');
const HistoryValidator = require('../../validators/seller/payment/history-validator');

module.exports = {
  batch: async (request, response, next) => {
    try {
      await BatchValidator(request.query);

      const result = await new BatchResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  index: async (request, response, next) => {
    console.log('order index');
    try {
      await OrderListValidator(request.query);

      const result = await new OrderListResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  listall: async (request, response, next) => {
    try {
      await OrderListValidator(request.query);

      const result = await new OrderListallResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  lalalistall: async (request, response, next) => {
    try {
      await OrderListValidator(request.query);

      const result = await new OrderLalaListallResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  mutasi: async (request, response, next) => {
    try {
      await MutasiValidator(request.query);
      const result = await new OrderMutasiResponse({ request });
      console.log('validaso lewat 3');
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
      await OrderDetailValidator(request);
      const result = await new OrderDetailResponse({ request });
      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  retur: async (request, response, next) => {
    try {

      await OrderListValidator(request.query);

      const result = await new OrderReturResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  export: async (request, response, next) => {
    try {
      let result = null;
      await ExportValidator(request.body);

      if (request.body.type === 'excel') result = await new ExportResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  print: async (request, response, next) => {
    try {
      await PrintValidator(request.body);

      const result = await new PrintResponse({ request });

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
