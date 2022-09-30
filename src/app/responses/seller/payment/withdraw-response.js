const shortid = require('shortid-36');
const httpErrors = require('http-errors');
const moment = require('moment-timezone');
const { withdraw } = require('../../../../helpers/xendit');
const jwtSelector = require('../../../../helpers/jwt-selector');
const { paymentStatus } = require('../../../../constant/status');
const {
  SellerDetail,
  Bank,
  CreditHistory,
  sequelize,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.bank = Bank;
    this.seller = SellerDetail;
    this.credit = CreditHistory;
    return this.process();
  }

  async process() {
    const dbTransaction = await sequelize.transaction();

    try {
      const { body } = this.request;
      const { PENDING } = paymentStatus;
      this.user = await jwtSelector({ request: this.request });

      const seller = await this.seller.findOne({
        where: { sellerId: this.user.id },
      });

      const bank = await this.bank.findOne({
        where: { id: seller.bankId },
      });

      const latestCredit = await this.credit.findOne({
        order: [['id', 'DESC']],
        limit: 1,
      });

      const externalId = `Sepaket-${shortid.generate()}${latestCredit?.id || 1}`;

      if (seller.credit < 10000) throw new Error('Saldo anda tidak mencukupi untuk melakukan penarikan dana');
      if (parseFloat(body.amount) < parseFloat(10000)) throw new Error('Minimal penarikan 10.000');
      if (!seller.bankId || !bank) throw new Error('Harap perbarui informasi bank anda');

      await this.credit.create(
        {
          externalId,
          provider: 'XENDIT',
          sellerId: seller?.id,
          withdraw: parseFloat(body.amount),
          status: PENDING.text,
          createdAt: moment().tz('Asia/Jakarta').format(),
          updatedAt: moment().tz('Asia/Jakarta').format(),
          requestPayload: JSON.stringify({
            externalId,
            amount: body.amount,
            bankCode: bank?.code,
            accountName: seller.bankAccountName,
            accountNumber: seller.bankAccountNumber,
            description: `Tarik saldo Sepaket pada ${moment().tz('Asia/Jakarta').format('HH:mm - DD MMM, YYYY')}`,
          }),
        },
        { transaction: dbTransaction },
      );

      await withdraw({
        externalId,
        amount: body.amount,
        bankCode: bank?.code,
        accountName: seller.bankAccountName,
        accountNumber: seller.bankAccountNumber,
        description: `Tarik saldo Sepaket pada ${moment().tz('Asia/Jakarta').format('HH:mm - DD MMM, YYYY')}`,
      });

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }
};
