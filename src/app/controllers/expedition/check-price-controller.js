// validator
const CheckPriceValidator = require('../../validators/expedition/check-price/check-price-validator');

// responses
const CheckPriceResponse = require('../../responses/expedition/check-price/check-price-response');

module.exports = async (request, response, next) => {
  try {
    await CheckPriceValidator(request.body);
    console.log("check price")
    const result = await new CheckPriceResponse({ request });

    var items = result.data;
    var cod = JSON.parse(JSON.stringify(items));
    var codItemIndex = 0;


    for (item in cod) {
      if (cod[item].type === 'JNE') {
        if (cod[item].service_code === 'REG19') {
          codItemIndex = item;
        }


      }
    }

    if (cod[codItemIndex].type === 'JNE') {
      cod[codItemIndex].service_name = 'JNE COD';
      cod[codItemIndex].service_code = 'JNECOD';
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
};
