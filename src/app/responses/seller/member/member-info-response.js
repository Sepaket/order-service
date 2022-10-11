const { Seller, SellerReferal } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.member = SellerReferal;
    this.request = request;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await jwtSelector({ request: this.request });
        const total = await this.totalMember(user.id);
        resolve({
          total_member: total,
          credit_referal: 1000,
        });
      } catch (error) {
        reject(new Error(error?.message));
      }
    });
  }

  async totalMember(sellerId) {
    try {
      const member = await this.member.findAll({
        where: { sellerId },
      });

      return member.length;
    } catch (error) {
      throw new Error(error?.message);
    }
  }
};
