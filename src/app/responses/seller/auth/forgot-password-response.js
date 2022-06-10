const shortid = require('shortid-36');
const { Seller } = require('../../../models');
const sender = require('../../../../helpers/email-sender');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.token = shortid.generate();

    this.request = request;
    return this.process();
  }

  async process() {
    return new Promise((resolve, reject) => {
      this.seller.update(
        { forgot_password_token: this.token },
        { where: { email: this.request.body.email } },
      )
        .then(() => {
          this.sendEmail();
          resolve(true);
        })
        .catch((error) => reject(error));
    });
  }

  async sendEmail() {
    const { email } = this.request.body;

    await sender({
      to: email,
      subject: 'Sepaket - Reset password',
      template: 'seller/forgot-password.ejs',
      content: {
        resetPasswordLink: `${process.env.APP_HOST}/api/v1/seller/auth/reset-password/${this.token}?email=${email}`,
      },
    });
  }
};
