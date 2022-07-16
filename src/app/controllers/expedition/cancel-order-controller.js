// validator
const CancelValidator = require('../../validators/expedition/cancel/cancel-validator');

// responses
const JneCancelResponse = require('../../responses/expedition/cancel/jne-cancel-response');
const NinjaCancelResponse = require('../../responses/expedition/cancel/ninja-cancel-response');
const SicepatCancelResponse = require('../../responses/expedition/cancel/sicepat-cancel-response');

module.exports = async (request, response, next) => {
  try {
    let result = null;
    const order = await CancelValidator(request.body);

    if (order.resi.expedition === 'JNE') result = await new JneCancelResponse({ request });
    if (order.resi.expedition === 'NINJA') result = await new NinjaCancelResponse({ request });
    if (order.resi.expedition === 'SICEPAT') result = await new SicepatCancelResponse({ request });

    response.send({
      code: 200,
      message: 'OK',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
