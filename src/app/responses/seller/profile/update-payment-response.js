const jwt = require('jsonwebtoken');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { SellerDetail, sequelize } = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.sellerDetail = SellerDetail;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      const dbTransaction = await sequelize.transaction();

      try {
        const { headers } = this.request;

        const parameterMapper = this.parameterMapper();
        const authorizationHeader = headers.authorization;
        const token = authorizationHeader
          .replace(/bearer/gi, '')
          .replace(/ /g, '');

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        this.userId = decoded.id;
        this.token = token;

        await this.sellerDetail.update(
          { ...parameterMapper },
          { where: { sellerId: decoded.id } },
          { transaction: dbTransaction },
        );

        await dbTransaction.commit();
        resolve(true);
      } catch (error) {
        await dbTransaction.rollback();
        reject(error);
      }
    });
  }

  parameterMapper() {
    const { body } = this.request;

    return {
      bankId: body.bank_id,
      bankAccountName: body.account_name,
      bankAccountNumber: body.account_number,
    };
  }
};
