const moment = require('moment-timezone');
const jwtSelector = require('../../../../helpers/jwt-selector');
const { Ticket, Seller, SellerDetail } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.ticket = Ticket;
    this.seller = Seller;
    this.sellerDetail = SellerDetail;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        this.sellerId = await jwtSelector({ request: this.request });
        this.sellerData = await this.seller.findOne({
          where: { id: this.sellerId.id },
          include: [
            {
              model: this.sellerDetail,
              as: 'sellerDetail',
              required: true,
            },
          ],
        });

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
      id: this.sellerId?.id,
      message: body.message,
      file: body.file,
      type: 'SELLER',
      commentAt: moment().tz('Asia/Jakarta').format('DD MMM, YYYY - HH:mm'),
      author: {
        name: this.sellerData?.name || '',
        photo: this.sellerData?.sellerDetail?.photo || '',
      },
    };
  }
};
