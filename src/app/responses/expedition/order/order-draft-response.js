const httpErrors = require('http-errors');
const { OrderFailed } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.orderFailed = OrderFailed;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      const { params } = this.request;

      this.orderFailed.findOne({
        attributes: [
          ['id', 'failed_id'],
          'batch_id',
          'payload',
        ],
        where: { batchId: params.batch_id },
      }).then((response) => {
        response.payload = JSON.parse(response.payload);

        if (response) resolve(response);
        else reject(httpErrors(404, 'No Data Found', { data: null }));
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
