const { SellerAddress } = require('../../../models');
const auth = require('../../../../helpers/auth');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    return this.process();
  }

  async process() {
    const sellerId = auth.sellerId(this.request);
    return new Promise((resolve, reject) => {
      SellerAddress.update(
        {
          sellerId,
          name: this.request.body.name,
          picName: this.request.body.pic_name,
          picPhoneNumber: this.request.body.pic_phone,
          address: this.request.body.address,
          addressDetail: this.request.body.address_detail,
          active: this.request.body.status,
        },
        { where: { id: this.request.body.id } },
      )
        .then(() => {
          resolve(true);
        })
        .catch((error) => reject(error));
    });
  }
};
