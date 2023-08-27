// validator
const CheckPriceValidator = require('../../validators/expedition/check-price/check-price-validator');

// responses
const CheckPriceResponse = require('../../responses/expedition/check-price/check-price-response');
const CheckLalamovePriceResponse = require('../../responses/expedition/check-price/check-lalamove-price-response');
const GetLalamoveCityResponse = require('../../responses/expedition/check-price/get-lalamove-city-response');
const cors = require('cors');

module.exports = {
  checkPrice: async (request, response, next) => {
    try {
      await CheckPriceValidator(request.body);
      const result = await new CheckPriceResponse({ request });
      console.log('after check price response');
      var items = result.data;
      var cod = JSON.parse(JSON.stringify(items));
      var codItemIndex = 0;

      // console.log(result);
      for (item in cod) {
        if (cod[item].type === 'JNE') {
          if (cod[item].service_code === 'REG23') {
            codItemIndex = item;
          }
        } else if (cod[item].type === 'NINJA') {
          if (cod[item].service_code === 'Standard') {
            codItemIndex = item;
          }
        } else if (cod[item].type === 'SICEPAT') {
          if (cod[item].service_code === 'SIUNT') {
            codItemIndex = item;
          }
        } else if (cod[item].type === 'SAP') {
          if (cod[item].service_code === 'UDRREG') {
            codItemIndex = item;
          }
        }
      }

      if (cod[codItemIndex].type === 'JNE') {
        cod[codItemIndex].service_name = 'JNE COD';
        cod[codItemIndex].service_code = 'JNECOD';
        result.data.push(cod[codItemIndex]);
      } else if (cod[codItemIndex].type === 'NINJA') {
        cod[codItemIndex].service_name = 'NINJA COD';
        cod[codItemIndex].service_code = 'NINJACOD';
        result.data.push(cod[codItemIndex]);
      } else if (cod[codItemIndex].type === 'SICEPAT') {
        cod[codItemIndex].service_name = 'SICEPAT COD';
        cod[codItemIndex].service_code = 'SICEPATCOD';
        result.data.push(cod[codItemIndex]);
      } else if (cod[codItemIndex].type === 'SAP') {
        cod[codItemIndex].service_name = 'SAP COD';
        cod[codItemIndex].service_code = 'SAPCOD';
        result.data.push(cod[codItemIndex]);
      }

      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  checkLalamovePrice: async (request, response, next) => {
    try {
      console.log('Check Lalamove Price');
      // await CheckPriceValidator(request.body);
      const result = await new CheckLalamovePriceResponse({ request });
      console.log('after check price response');
      var items = result.data;
      var cod = JSON.parse(JSON.stringify(items));
      var codItemIndex = 0;
      response.send({
        code: 200,
        message: 'OK',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  getLalamoveCity: async (request, response, next) => {
    try {
      console.log('get lalamove city');
      // await CheckPriceValidator(request.body);
      const result = await new GetLalamoveCityResponse({ request });
      console.log('after check city response');
      var items = result.data;
      var cod = JSON.parse(JSON.stringify(items));
      var codItemIndex = 0;
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

