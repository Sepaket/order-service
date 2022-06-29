const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');
const hash = require('../../../../helpers/hash');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { Seller, SellerDetail } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.sellerDetail = SellerDetail;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        const { headers, body } = this.request;

        const authorizationHeader = headers.authorization;
        const token = authorizationHeader
          .replace(/bearer/gi, '')
          .replace(/ /g, '');

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        this.userId = decoded.id;
        this.token = token;

        if (await this.checkOldPassword()) {
          reject(httpErrors(422, 'Password should different with current password', { data: false }));
          return;
        }

        this.seller.update(
          { password: await hash({ payload: body.new_password }) },
          { where: { id: decoded.id } },
        );

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  async checkOldPassword() {
    try {
      const { body } = this.request;
      const seller = await this.seller.findOne({ where: { id: this.userId } });
      const compared = await bcrypt.compare(body.new_password, seller.password);
      const oldPassword = await bcrypt.compare(body.old_password, seller.password);

      if (!oldPassword) {
        throw new Error('old password does not match with current password');
      }

      return compared;
    } catch (error) {
      throw new Error(error.message);
    }
  }
};
