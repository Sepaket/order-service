// validator
const CancelValidator = require('../../validators/expedition/cancel/cancel-validator');

// responses
const JneCancelResponse = require('../../responses/expedition/cancel/jne-cancel-response');

module.exports = async (request, response, next) => {
  try {
    let result = null;
    const order = await CancelValidator(request.body);

    if (order.resi.expedition === 'JNE') result = await new JneCancelResponse({ request });

    response.send({
      code: 200,
      message: 'OK',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
