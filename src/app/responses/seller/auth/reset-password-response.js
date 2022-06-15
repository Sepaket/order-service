const hash = require('../../../../helpers/hash');
const { Seller } = require('../../../models');
const sender = require('../../../../helpers/email-sender');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.seller = null;
    this.getSeller();
    return this.process();
  }

  async process() {
    const password = await hash({ payload: this.request.body.new_password });
    return new Promise((resolve, reject) => {
      Seller.update(
        {
          password,
          forgot_password_token: null,
        },
        { where: { forgot_password_token: this.request.body.token } },
      )
        .then(() => {
          this.sendEmail();
          resolve(true);
        })
        .catch((error) => reject(error));
    });
  }

  async getSeller() {
    const seller = await Seller.findOne({
      where: { forgot_password_token: this.request.body.token },
    });

    if (!seller) {
      this.seller = seller;
    }
  }

  async sendEmail() {
    await sender({
      to: this.seller.email,
      subject: 'Sepaket - Reset password sukses',
      template: 'seller/reset-password.ejs',
      content: {},
    });
  }
};