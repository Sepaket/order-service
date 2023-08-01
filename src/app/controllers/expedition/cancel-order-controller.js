// validator
const CancelValidator = require('../../validators/expedition/cancel/cancel-validator');

// responses
const JneCancelResponse = require('../../responses/expedition/cancel/jne-cancel-response');
const NinjaCancelResponse = require('../../responses/expedition/cancel/ninja-cancel-response');
const SicepatCancelResponse = require('../../responses/expedition/cancel/sicepat-cancel-response');


/*
Order cancellation belum bisa dilakukan secara serentak secara async. ada race condition yang menyebabkan perhitungan saldonya tidak tepat
 */
module.exports = async (request, response, next) => {
  try {
    let result = null;
    console.log('cancelling order...');
    const order = await CancelValidator(request);
    const expedition = order?.id?.expedition;
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
