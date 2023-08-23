// validator
const TicketListValidator = require('../../validators/admin/ticket/list-validator');
const TicketDetailValidator = require('../../validators/admin/ticket/detail-validator');
const TicketCommentValidator = require('../../validators/admin/ticket/comment-validator');
const TicketStatusValidator = require('../../validators/admin/ticket/status-validator');

// responses
const TicketListResponse = require('../../responses/admin/ticket/ticket-list-response');
const TicketDetailResponse = require('../../responses/admin/ticket/ticket-detail-response');
const TicketCommentResponse = require('../../responses/admin/ticket/ticket-comment-response');
const TicketUpdateResponse = require('../../responses/admin/ticket/ticket-update-response');
const AdminTicketCreateValidator = require('../../validators/admin/ticket/create-validator');
const TicketCreateResponse = require('../../responses/seller/ticket/ticket-create-response');

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

  detail: async (request, response, next) => {
    try {
      await TicketDetailValidator(request.params);

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

  create: async (request, response, next) => {
    try {

      await AdminTicketCreateValidator(request);
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

  update: async (request, response, next) => {
    try {
      await TicketStatusValidator(request.params);

      await new TicketUpdateResponse({ request });
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

  comment: async (request, response, next) => {
    try {
      await TicketCommentValidator(request.body);
      await TicketDetailValidator(request.params);

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
