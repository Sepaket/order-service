// validator
const CheckPriceValidator = require('../../validators/expedition/check-price/check-price-validator');

// responses
const CheckPriceResponse = require('../../responses/expedition/check-price/check-price-response');

module.exports = async (request, response, next) => {
  try {
    await CheckPriceValidator(request.body);

    const result = await new CheckPriceResponse({ request });

    var items = result.data;
    var cod = {};
// console.log(items.length);
for (item in items) {

console.log(items[item]);
  if (items[item].type === 'JNE') {
    if (items[item].service_code === 'REG19') {
      cod = items[item];
    }
  }

}
if (cod !== {}) {
  cod.service_name = 'JNE COD';
  cod.service_code = 'JNECOD';
}
result.data.push(cod);
    response.send({
      code: 200,
      message: 'OK',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
