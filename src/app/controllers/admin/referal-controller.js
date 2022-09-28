// validator
const ReferalListValidator = require('../../validators/admin/referal/list-validator');
const ReferalDetailValidator = require('../../validators/admin/referal/detail-validator');
const ReferalExportValidator = require('../../validators/admin/referal/export-validator');

// responses
const ReferalListResponse = require('../../responses/admin/referal/referal-list-response');
const ReferalDetailResponse = require('../../responses/admin/referal/referal-detail-response');
const ReferalExportResponse = require('../../responses/admin/referal/referal-export-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      await ReferalListValidator(request.query);

      const result = await new ReferalListResponse({ request });

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
      await ReferalDetailValidator(request.params);

      const result = await new ReferalDetailResponse({ request });

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
      await ReferalExportValidator(request.body);

      const result = await new ReferalExportResponse({ request });

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
