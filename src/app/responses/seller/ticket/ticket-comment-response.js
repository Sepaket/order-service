const moment = require('moment-timezone');
const { Ticket } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.ticket = Ticket;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        this.seller = await jwtSelector({ request: this.request });
        const { params } = this.request;
        const parameter = this.parameterMapper();
        const ticket = await this.ticket.findOne({ where: { id: params.id } });
        const prevComment = ticket?.comment;
        const comments = [];

        if (ticket) comments.push(...prevComment);
        comments.push(parameter);

        const payload = comments.filter((item) => item);

        await this.ticket.update(
          { comment: payload },
          { where: { id: params.id } },
        );

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  parameterMapper() {
    const { body } = this.request;

    return {
      id: this.seller?.id,
      message: body.message,
      file: body.file,
      type: 'SELLER',
      commentAt: moment().tz('Asia/Jakarta').format('DD MMM, YYYY - HH:mm'),
    };
  }
};
