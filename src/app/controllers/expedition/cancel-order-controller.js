// validator
const CancelValidator = require('../../validators/expedition/cancel/cancel-validator');

// responses
const JneCancelResponse = require('../../responses/expedition/cancel/jne-cancel-response');
const NinjaCancelResponse = require('../../responses/expedition/cancel/ninja-cancel-response');
const SicepatCancelResponse = require('../../responses/expedition/cancel/sicepat-cancel-response');

module.exports = async (request, response, next) => {
  try {
    let result = null;
    console.log('cancelling order...');
    // console.log(request);
    const order = await CancelValidator(request);
    const expedition = order?.id?.order?.expedition;

    if (expedition === 'JNE') result = await new JneCancelResponse({ request });
    if (expedition === 'NINJA') result = await new NinjaCancelResponse({ request });
    if (expedition === 'SICEPAT') result = await new SicepatCancelResponse({ request });

    response.send({
      code: 200,
      message: 'OK',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
