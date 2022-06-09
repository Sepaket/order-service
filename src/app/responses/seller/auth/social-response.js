const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');
const { Seller, SellerDetail } = require('../../../models');
const { setRedisData } = require('../../../../helpers/redis');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.sellerDetail = SellerDetail;
    this.request = request;
    return this.process();
  }

  async process() {
    return new Promise((resolve, reject) => {
      const { body } = this.request;

      this.seller.findOne({
        where: { socialId: body.social_id },
        include: [
          {
            model: this.sellerDetail,
            as: 'sellerDetail',
            required: true,
          },
        ],
      }).then((credential) => {
        if (!credential) {
          reject(httpErrors(400, 'Email not found'));
          return;
        }

        this.user = credential;
        this.generateToken();
        this.storeToRedis();

        resolve({
          token: this.token,
          biodata: {
            seller_id: credential.id,
            email: credential.email,
            name: credential.name,
            photo: credential.sellerDetail.photo,
            credit: credential.sellerDetail.credit || 0,
          },
        });
      });
    });
  }

  generateToken() {
    const token = jwt.sign(
      { id: this.user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' },
    );

    this.token = token;
  }

  storeToRedis() {
    setRedisData(
      {
        db: 0,
        key: `token-${this.user.email}`,
        timeout: 86400000,
        data: this.token,
      },
    );
  }
};
