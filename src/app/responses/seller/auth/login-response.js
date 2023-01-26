const bcrypt = require('bcrypt');
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
      const { email, password } = this.request.body;

      this.seller.findOne({
        where: { email },
        include: [
          {
            model: this.sellerDetail,
            as: 'sellerDetail',
            required: true,
          },
        ],
      }).then((credential) => {
        if (!credential) return reject(httpErrors(400, 'Email not found'));
        if (!credential.isNew) {
          console.log("ada maslaah di credential");
          console.log(credential.isNew);
          return reject(
            httpErrors(400, 'Maaf, sistem tengah mengalami pembaruan. Harap reset password kamu, Silahkan klik tautan "Lupa Kata Sandi"'),
          );
        }

        if (!credential.isVerified) return reject(httpErrors(400, 'Please activate your email first'));

        // check password match
        return bcrypt.compare(password, credential.password).then((match) => {
          if (!match) return reject(httpErrors(400, 'Email or password does not match'));

          this.user = credential;
          this.generateToken();
          this.storeToRedis();

          return resolve({
            token: this.token,
            biodata: {
              seller_id: credential.id,
              email: credential.email,
              name: credential.name,
              photo: credential.sellerDetail.photo,
              credit: credential.sellerDetail.credit || 0,
            },
          });
        }).catch((error) => {
          reject(error);
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
