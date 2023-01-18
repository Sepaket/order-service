const BatchValidator = require('../../validators/admin/order/batch-validator');
const OrderListValidator = require('../../validators/admin/order/list-validator');
const OrderDetailValidator = require('../../validators/admin/order/detail-validator');
const ExportValidator = require('../../validators/admin/order/export-validator');
const PrintValidator = require('../../validators/admin/order/print-validator');

const BatchResponse = require('../../responses/admin/order/order-batch-response');
const OrderListResponse = require('../../responses/admin/order/order-list-response');
const OrderDetailResponse = require('../../responses/admin/order/order-detail-response');
const ExportResponse = require('../../responses/admin/order/order-export-response');
const PrintResponse = require('../../responses/admin/order/order-print-response');
const OrderListallResponse = require('../../responses/admin/order/order-listall-response');

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
