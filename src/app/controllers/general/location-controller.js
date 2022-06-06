// validator
const ProvinceListValidator = require('../../validators/general/location/province/province-list-validator');
const ProvinceDetailValidator = require('../../validators/general/location/province/province-detail-validator');
const CityDetailValidator = require('../../validators/general/location/city/city-detail-validator');
const CityListValidator = require('../../validators/general/location/city/city-list-validator');
const DistrictListValidator = require('../../validators/general/location/district/district-list-validator');
const DistrictDetailValidator = require('../../validators/general/location/district/district-detail-validator');
const SubDistrictListValidator = require('../../validators/general/location/sub-district/sub-district-list-validator');
const SubDistrictDetailValidator = require('../../validators/general/location/sub-district/sub-district-detail-validator');
const LocationValidator = require('../../validators/general/location/location/location-list-validator');

// responses
const ProvinceListResponse = require('../../responses/general/location/province/province-list-response');
const ProvinceDetailResponse = require('../../responses/general/location/province/province-detail-response');
const CityListResponse = require('../../responses/general/location/city/city-list-response');
const CityDetailResponse = require('../../responses/general/location/city/city-detail-response');
const DistrictListResponse = require('../../responses/general/location/district/district-list-response');
const DistrictDetailResponse = require('../../responses/general/location/district/district-detail-response');
const SubDistrictListResponse = require('../../responses/general/location/sub-district/sub-district-list-response');
const SubDistrictDetailResponse = require('../../responses/general/location/sub-district/sub-district-detail-response');
const LocationListResponse = require('../../responses/general/location/location/location-list-response');

module.exports = {
  locationList: async (request, response, next) => {
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

  // locationDetail: async (request, response, next) => {
  //
  // },

  provinceList: async (request, response, next) => {
    try {
      await ProvinceListValidator(request.query);

      const result = await new ProvinceListResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  provinceDetail: async (request, response, next) => {
    try {
      await ProvinceDetailValidator(request.params);

      const result = await new ProvinceDetailResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  cityList: async (request, response, next) => {
    try {
      await CityListValidator(request.query);

      const result = await new CityListResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  cityDetail: async (request, response, next) => {
    try {
      await CityDetailValidator(request.params);

      const result = await new CityDetailResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  districtList: async (request, response, next) => {
    try {
      await DistrictListValidator(request.query);

      const result = await new DistrictListResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  districtDetail: async (request, response, next) => {
    try {
      await DistrictDetailValidator(request.params);

      const result = await new DistrictDetailResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  subDistrictList: async (request, response, next) => {
    try {
      await SubDistrictListValidator(request.query);

      const result = await new SubDistrictListResponse({ request });

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  subDistrictDetail: async (request, response, next) => {
    try {
      await SubDistrictDetailValidator(request.params);

      const result = await new SubDistrictDetailResponse({ request });

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
