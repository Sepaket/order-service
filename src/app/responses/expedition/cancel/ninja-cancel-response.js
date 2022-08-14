const ninja = require('../../../../helpers/ninja');
const { Order, OrderLog, sequelize } = require('../../../models');
const orderStatus = require('../../../../constant/order-status');

module.exports = class {
  constructor({ request }) {
    this.ninja = ninja;
    this.request = request;
    this.order = Order;
    this.orderLog = OrderLog;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        const { body } = this.request;
        const canceled = await this.ninja.cancel({ resi: body.resi });

        if (canceled) await this.insertLog();

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  async insertLog() {
    const { body } = this.request;
    const dbTransaction = await sequelize.transaction();

    try {
      const order = await this.order.findOne({ where: { resi: body.resi } });

      await this.order.update(
        { status: orderStatus.CANCELED.text },
        { where: { id: order.id } },
        { transaction: dbTransaction },
      );

      await this.orderLog.create(
        {
          previousStatus: order.status,
          currentStatus: orderStatus.CANCELED.text,
          orderId: order.id,
        },
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(error?.message || 'Something Wrong');
    }
  }
};
