const { SellerDetail } = require('../../../models');

module.exports = class {
  constructor() {
    return this.process();
  }

  // eslint-disable-next-line class-methods-use-this
  async process() {
    return new Promise((resolve, reject) => {
      try {
        const totalBalance = SellerDetail.sum('credit');
        if (totalBalance) {
          resolve(totalBalance);
        }

        resolve(0);
      } catch (error) {
        reject(error);
      }
    });
  }
};
