// validator
const LocationValidator = require('../../validators/general/location/location-list-validator');
const LocationDetailValidator = require('../../validators/general/location/location-detail-validator');

// responses
const LocationListResponse = require('../../responses/general/location/location-list-response');
const LocationDetailResponse = require('../../responses/general/location/location-detail-response');

module.exports = {
  index: async (request, response, next) => {
    try {
      await LocationValidator(request.query);

      const result = await new LocationListResponse({ request });

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
      await LocationDetailValidator(request.body);

      const result = await new LocationDetailResponse({ request });

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
