const { Ticket } = require('../../../models');
const { status } = require('../../../../constant/ticket');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.ticket = Ticket;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        const { params } = this.request;
        const parameter = this.parameterMapper();
        const ticket = await this.ticket.findOne({ where: { id: params.id } });

        if (params.status === 'process' && ticket.status === status.SOLVED.status) {
          reject(new Error('Tiket ini sudah terselesaikan!'));
          return;
        }

        if (params.status === 'process' && ticket.status === status.ON_PROGRESS.status) {
          reject(new Error('Anda telah memproses ticket ini'));
          return;
        }

        if (params.status === 'solved' && ticket.status === status.SOLVED.status) {
          reject(new Error('Anda telah menyelesaikan ticket ini'));
          return;
        }

        await this.ticket.update(
          { ...parameter },
          { where: { id: params.id } },
        );

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  parameterMapper() {
    const { params } = this.request;

    const statusSelected = params.status === 'process'
      ? status.ON_PROGRESS.status
      : status.SOLVED.status;

    return {
      status: statusSelected,
    };
  }
};
