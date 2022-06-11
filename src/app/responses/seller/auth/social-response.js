const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { setRedisData } = require('../../../../helpers/redis');
const { Seller, SellerDetail, sequelize } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.sellerDetail = SellerDetail;
    this.op = Sequelize.Op;
    this.request = request;
    return this.process();
  }

  async process() {
    return new Promise(async (resolve, reject) => {
      try {
        let sellerFound = null;
        const { body } = this.request;
        const seller = await this.seller.findOne({
          where: {
            [this.op.or]: {
              email: body.email,
              socialId: body.social_id,
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

        const condition = (
          (seller && seller.socialId !== body.social_id)
          || (seller && seller.email !== body.email)
        );

        if (condition) {
          reject(httpErrors(400, 'Email and social_id not match'));
          return;
        }

        if (!seller) sellerFound = await this.createNewUser();
        else sellerFound = seller;

        this.user = sellerFound;
        this.generateToken();
        this.storeToRedis();

        resolve({
          token: this.token,
          biodata: {
            seller_id: this.user.id,
            email: this.user.email,
            name: this.user.name,
            photo: this.user.sellerDetail.photo,
            credit: this.user.sellerDetail.credit || 0,
          },
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async createNewUser() {
    const dbTransaction = await sequelize.transaction();

    try {
      const { body } = this.request;

      const created = await this.seller.create({
        name: body.name,
        email: body.email,
        password: '-1',
        phone: '0',
        socialId: body.social_id,
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
