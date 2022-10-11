const sicepat = require('../../../../helpers/sicepat');
const orderStatus = require('../../../../constant/order-status');
const {
  Order,
  OrderLog,
  sequelize,
  OrderDetail,
  SellerDetail,
  OrderBackground,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.order = Order;
    this.sicepat = sicepat;
    this.request = request;
    this.orderLog = OrderLog;
    this.orderDetail = OrderDetail;
    this.sellerDetail = SellerDetail;
    this.background = OrderBackground;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        const { params } = this.request;

        const order = await this.order.findOne({
          where: { id: params.id },
          include: [{ model: this.orderDetail, as: 'detail', required: true }],
        });

        if (order && order.status === 'CANCELED') throw new Error('Order ini sudah di batalkan');

        await this.sicepat.cancel({ resi: order.resi });

        this.insertLog(order);

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  async insertLog(order) {
    const dbTransaction = await sequelize.transaction();

    try {
      await this.order.update(
        { status: orderStatus.CANCELED.text },
        { where: { id: order.id } },
        { transaction: dbTransaction },
      );

      await this.orderLog.create(
        {
          orderId: order.id,
          previousStatus: order.status,
          currentStatus: orderStatus.CANCELED.text,
          note: 'Paket Dibatalkan oleh Penjual',
        },
        { transaction: dbTransaction },
      );

      await this.background.update(
        { isExecute: true },
        { where: { resi: order.resi } },
        { transaction: dbTransaction },
      );

      if (!order.isCod) {
        const shippingCalculated = order?.detail?.shippingCalculated;
        const seller = await this.sellerDetail.findOne({
          where: { sellerId: order.detail.sellerId },
        });

        const creditValue = seller.credit === 'NaN' ? 0 : seller.credit;
        const credit = parseFloat(creditValue) + parseFloat(shippingCalculated);

        await this.sellerDetail.update(
          { credit },
          { where: { sellerId: seller.sellerId } },
          { transaction: dbTransaction },
        );
      }

      await dbTransaction.commit();
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(error?.message || 'Something Wrong');
    }
  }
};
