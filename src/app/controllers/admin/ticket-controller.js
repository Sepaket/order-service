// validator
const TicketListValidator = require('../../validators/admin/ticket/list-validator');
const TicketDetailValidator = require('../../validators/admin/ticket/detail-validator');
const TicketCommentValidator = require('../../validators/admin/ticket/comment-validator');

// responses
const TicketListResponse = require('../../responses/admin/ticket/ticket-list-response');
const TicketDetailResponse = require('../../responses/admin/ticket/ticket-detail-response');
const TicketCommentResponse = require('../../responses/admin/ticket/ticket-comment-response');

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
