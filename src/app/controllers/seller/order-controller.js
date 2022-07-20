// validator
const BatchValidator = require('../../validators/seller/order/batch-validator');
const OrderListValidator = require('../../validators/seller/order/list-validator');
const OrderDetailValidator = require('../../validators/seller/order/detail-validator');
const ExportValidator = require('../../validators/seller/order/export-validator');

// responses
const BatchResponse = require('../../responses/seller/order/order-batch-response');
const OrderListResponse = require('../../responses/seller/order/order-list-response');
const OrderDetailResponse = require('../../responses/seller/order/order-detail-response');
const ExportResponse = require('../../responses/seller/order/order-export-response');

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

  exportExcel: async (request, response, next) => {
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
};
