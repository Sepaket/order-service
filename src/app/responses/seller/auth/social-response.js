const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { OAuth2Client } = require('google-auth-library');
const { setRedisData } = require('../../../../helpers/redis');
const { Seller, SellerDetail, sequelize } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.sellerDetail = SellerDetail;
    this.op = Sequelize.Op;
    this.request = request;
    this.googleClient = new OAuth2Client(
      {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
      },
    );

    return this.process();
  }

  async process() {
    return new Promise(async (resolve, reject) => {
      try {
        let userInfo = null;

        if (this.request.body.service === 'google') {
          userInfo = await this.getGoogleUserInfo();
        }

        if (this.request.body.service === 'facebook') {
          userInfo = this.getFacebookUserInfo();
        }

        let sellerFound = null;

        const seller = await this.seller.findOne({
          where: {
            [this.op.or]: {
              email: userInfo.email,
              socialId: userInfo.socialId,
            },
          },
          include: [
            {
              model: this.sellerDetail,
              as: 'sellerDetail',
              required: false,
            },
          ],
        });

        if ((seller.socialId !== '' && seller.socialId !== null)) {
          const condition = (
            (seller && seller.socialId !== userInfo.socialId)
            || (seller && seller.email !== userInfo.email)
          );

          if (condition) {
            reject(httpErrors(400, 'Email and social_id not match'));
            return;
          }
        }

        if (!seller) {
          sellerFound = await this.createNewUser(userInfo);
        } else {
          this.updateUserSocialId(seller, userInfo);
          sellerFound = seller;
        }

        this.user = sellerFound;
        this.generateToken();
        this.storeToRedis();

        resolve({
          token: this.token,
          biodata: {
            seller_id: this.user.id,
            email: this.user.email,
            name: this.user.name,
            photo: this.user.sellerDetail.photo || '',
            credit: this.user.sellerDetail.credit || 0,
          },
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async getGoogleUserInfo() {
    const { tokens } = await this.googleClient.getToken(this.request.body.code);
    this.googleClient.setCredentials({ access_token: tokens.access_token });
    const userInfo = await this.googleClient.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });

    return {
      email: userInfo.data.email,
      socialId: userInfo.data.sub,
      name: `${userInfo.data.given_name} ${userInfo.data.family_name}`,
    };
  }

  getFacebookUserInfo() {
    return {
      email: this.request.body.email,
      socialId: this.request.body.social_id,
      name: this.request.body.name,
    };
  }

  async createNewUser(userInfo) {
    const dbTransaction = await sequelize.transaction();

    try {
      const created = await this.seller.create({
        name: userInfo.name,
        email: userInfo.email,
        password: '-1',
        phone: '0',
        socialId: userInfo.socialId,
        isVerified: true,
      }, { transaction: dbTransaction });

      await this.sellerDetail.create(
        { sellerId: created.id },
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();

      const seller = await this.seller.findOne({
        where: { id: created.id },
        include: [
          {
            model: this.sellerDetail,
            as: 'sellerDetail',
            required: false,
          },
        ],
      });

      return seller;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }

  async updateUserSocialId(seller, userInfo) {
    const dbTransaction = await sequelize.transaction();

    try {
      await this.seller.update({
        socialId: userInfo.socialId,
      }, { where: { id: seller.id }, transaction: dbTransaction });
      await dbTransaction.commit();
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
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
