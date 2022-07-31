const httpErrors = require('http-errors');
const { topup } = require('../../../../helpers/xendit');
const { Seller } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.request = request;
    return this.process();
  }

  async process() {
    try {
      const { body } = this.request;
      this.user = await jwtSelector({ request: this.request });
      const seller = this.seller.findOne({ where: { id: this.user.id } });

      if (!seller) throw new Error('');

      const payment = await topup({
        email: seller?.email,
        externalId: 'Sepaket',
        amount: body.amount,
      });

      return payment?.data?.invoice_url || '';
    } catch (error) {
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
