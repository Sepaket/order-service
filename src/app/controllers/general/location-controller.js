// validator
const LocationValidator = require('../../validators/general/location/location-list-validator');

// responses
const LocationListResponse = require('../../responses/general/location/location-list-response');

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
};
