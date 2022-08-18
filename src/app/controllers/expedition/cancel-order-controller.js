// validator
const CancelValidator = require('../../validators/expedition/cancel/cancel-validator');

// responses
const JneCancelResponse = require('../../responses/expedition/cancel/jne-cancel-response');
const NinjaCancelResponse = require('../../responses/expedition/cancel/ninja-cancel-response');
const SicepatCancelResponse = require('../../responses/expedition/cancel/sicepat-cancel-response');

module.exports = async (request, response, next) => {
  try {
    let result = [];
    const orders = await CancelValidator(request.body);

    request.body = orders;
    const jneCancel = await new JneCancelResponse({ request });
    const sicepatCancel = await new SicepatCancelResponse({ request });
    const ninjaCancel = await new NinjaCancelResponse({ request });

    result = result.concat(jneCancel);
    result = result.concat(ninjaCancel);
    result = result.concat(sicepatCancel);
    result = result.filter((item) => item);
    result = [...new Map(result.map((item) => [item.id, item])).values()];

    response.send({
      code: 200,
      message: 'OK',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
