const httpErrors = require('http-errors');
const { Ticket, sequelize } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');
const { categories, status } = require('../../../../constant/ticket');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.ticket = Ticket;
    return this.process();
  }

  async process() {
    const dbTransaction = await sequelize.transaction();

    try {
      this.seller = await jwtSelector({ request: this.request });
      const parameterMapper = await this.mapper();

      await this.ticket.create(
        { ...parameterMapper },
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(httpErrors(500, error.message, { data: false }));
    }
  }

  async mapper() {
    const { body } = this.request;
    const category = categories.find((item) => item.id === body.category);

    return {
      orderId: body.order_id,
      sellerId: this.seller.id,
      title: body.title,
      message: body.message,
      category: category.content,
      priority: body.priority,
      file: body.file,
      status: status.IN_QUEUE.status,
    };
  }
};
