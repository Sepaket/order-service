const moment = require('moment-timezone');
const { Ticket, Admin } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.ticket = Ticket;
    this.admin = Admin;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        this.adminId = await jwtSelector({ request: this.request });
        this.adminData = await this.admin.findOne({ where: { id: this.adminId.id } });
        const { params } = this.request;
        const parameter = this.parameterMapper();
        const ticket = await this.ticket.findOne({ where: { id: params.id } });
        const prevComment = ticket?.comment;
        const comments = [];

        if (ticket?.comment) comments.push(...prevComment);
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
      id: this.adminId?.id,
      message: body.message,
      file: body.file,
      type: 'ADMIN',
      commentAt: moment().tz('Asia/Jakarta').format('DD MMM, YYYY - HH:mm'),
      author: {
        name: this.adminData.name,
        photo: '',
      },
    };
  }
};
