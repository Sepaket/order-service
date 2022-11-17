// validator
const CheckPriceValidator = require('../../validators/expedition/check-price/check-price-validator');

// responses
const CheckPriceResponse = require('../../responses/expedition/check-price/check-price-response');

module.exports = async (request, response, next) => {
  try {
    await CheckPriceValidator(request.body);

    const result = await new CheckPriceResponse({ request });
console.log(result.data);
    response.send({
      code: 200,
      message: 'OK',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
