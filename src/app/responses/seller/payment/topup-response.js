const shortid = require('shortid-36');
const moment = require('moment-timezone');
const httpErrors = require('http-errors');
const { topup } = require('../../../../helpers/xendit');
const { Seller, CreditHistory } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');
const { paymentStatus } = require('../../../../constant/status');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.request = request;
    this.credit = CreditHistory;
    return this.process();
  }

  async process() {
    try {
      const { body } = this.request;
      const { PENDING } = paymentStatus;
      this.user = await jwtSelector({ request: this.request });
      const seller = await this.seller.findOne({ where: { id: this.user.id } });
      const latestCredit = await this.credit.findOne({
        order: [['id', 'DESC']],
        limit: 1,
      });

      const externalId = `Sepaket-${shortid.generate()}${latestCredit?.id || 1}`;

      const payment = await topup({
        externalId,
        email: seller?.email,
        amount: body.amount,
      });

      await this.credit.create({
        externalId,
        provider: 'XENDIT',
        sellerId: seller?.id,
        topup: parseFloat(body.amount),
        status: PENDING.text,
        createdAt: moment().tz('Asia/Jakarta').format(),
        updatedAt: moment().tz('Asia/Jakarta').format(),
        requestPayload: JSON.stringify({
          externalId,
          amount: parseFloat(body.amount),
          customer: { email: seller?.email },
        }),
      });

      return payment?.data?.invoice_url || '';
    } catch (error) {
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
