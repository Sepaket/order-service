// validator
const TicketListValidator = require('../../validators/seller/ticket/list-validator');
const TicketCreateValidator = require('../../validators/seller/ticket/create-validator');
const TicketDetailValidator = require('../../validators/seller/ticket/detail-validator');
const TicketDetailResiValidator = require('../../validators/seller/ticket/detail-resi-validator');
const TicketCommentValidator = require('../../validators/seller/ticket/comment-validator');

// responses
const TicketListResponse = require('../../responses/seller/ticket/ticket-list-response');
const TicketDetailResponse = require('../../responses/seller/ticket/ticket-detail-response');
const TicketDetailResiResponse = require('../../responses/seller/ticket/ticket-detail-resi-response');
const TicketCreateResponse = require('../../responses/seller/ticket/ticket-create-response');
const TicketCommentResponse = require('../../responses/seller/ticket/ticket-comment-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      await TicketListValidator(request.query);

      const result = await new TicketListResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (request, response, next) => {
    try {
      console.log('Ticket create');
      await TicketCreateValidator(request);
      console.log('Ticket create - after validator');
      const result = await new TicketCreateResponse({ request });

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
      await TicketDetailValidator(request);

      const result = await new TicketDetailResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  detailByResi: async (request, response, next) => {
    try {
      await TicketDetailResiValidator(request);

      // const result = await new TicketDetailResiResponse({ request });
      //
      // response.send({
      //   code: 200,
      //   message: 'OK',
      //   data: result,
      // });
    } catch (error) {
      next(error);
    }
  },

  comment: async (request, response, next) => {
    try {
      await TicketCommentValidator(request.body);
      await TicketDetailValidator(request);

      await new TicketCommentResponse({ request });
      const result = await new TicketDetailResponse({ request });

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
