// validator
const CancelValidator = require('../../validators/expedition/cancel/cancel-validator');

// responses
// const JneCancelResponse = require('../../responses/expedition/cancel/jne-cancel-response');
// const NinjaCancelResponse = require('../../responses/expedition/cancel/ninja-cancel-response');
// const SicepatCancelResponse =
// require('../../responses/expedition/cancel/sicepat-cancel-response');

module.exports = async (request, response, next) => {
  try {
    const orders = await CancelValidator(request.body);
    const result = orders.resi.map((item) => ({
      resi: item.resi,
      status: true,
      message: 'OK',
    }));

    response.send({
      code: 200,
      message: 'OK',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
