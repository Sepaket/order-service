const httpErrors = require('http-errors');
const shortid = require('shortid-36');
const hash = require('../../../../helpers/hash');
const sender = require('../../../../helpers/email-sender');
const { setRedisData } = require('../../../../helpers/redis');
const {
  Seller,
  sequelize,
  SellerDetail,
  SellerReferal,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.seller = Seller;
    this.sellerDetail = SellerDetail;
    this.sellerReferal = SellerReferal;
    this.request = request;
    return this.process();
  }

  async process() {
    const dbTransaction = await sequelize.transaction();

    try {
      const { body } = this.request;
      const parameterMapper = await this.mapper();

      const seller = await this.seller.create(
        { ...parameterMapper },
        { transaction: dbTransaction },
      );

      await this.sellerDetail.create(
        {
          sellerId: seller.id,
          referalCode: body.referal_code,
        },
        { transaction: dbTransaction },
      );

      if (body.referal_code) {
        const parrent = await this.sellerDetail.findOne({
          where: { referalCode: body.referal_code },
        });

        await this.sellerReferal.create(
          {
            sellerId: parrent.sellerId,
            memberId: seller.id,
            referalCode: body.referal_code,
          },
          { transaction: dbTransaction },
        );
      }

      await this.send();

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }

  async mapper() {
    const { body } = this.request;

    return {
      name: body.name,
      email: body.email,
      password: await hash({ payload: body.password }),
      phone: body.phone,
      isNew: true,
    };
  }

  async send() {
    const { email } = this.request.body;
    this.token = shortid.generate();
    this.email = email;
    this.storeToRedis();

    await sender({
      to: email,
      subject: 'Email Activation',
      template: 'seller/activation-email.ejs',
      content: {
        activationLink: `${process.env.WEB_URL}/verify/${this.token}?email=${email}`,
      },
    });
  }

  storeToRedis() {
    setRedisData(
      {
        db: 1,
        key: `email-token-${this.email}`,
        timeout: 300000,
        data: this.token,
      },
    );
  }
};
