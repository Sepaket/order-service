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
          where: { id: params.id, expedition: 'SICEPAT' },
          include: [{ model: this.orderDetail, as: 'detail', required: true }],
        });

        const cancelExternal = await this.sicepat.cancel({ resi: order.resi });

        if (!cancelExternal.status) throw new Error(cancelExternal.message);

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

      if (this.orderNotCod.length > 0) {
        const orders = this.orderNotCod;
        const credits = orders.map((item) => ({
          charge: item.detail.shippingCharge,
          sellerId: item.detail.sellerId,
        }));

        const sellerId = orders.map((item) => item.detail.sellerId);
        const sellers = await this.sellerDetail.findAll({ where: { sellerId } });
        const mapped = sellers.map((seller) => {
          const charges = credits
            .filter((item) => item.sellerId === seller.sellerId)
            .map((item) => item.charge)
            .reduce((total, item) => parseFloat(item) + parseFloat(total), parseFloat(0));

          return {
            id: seller.sellerId,
            credit: parseFloat(charges) + parseFloat(seller.credit),
          };
        });

        await Promise.all(
          mapped.map(async (item) => {
            await this.sellerDetail.update(
              { credit: item.credit },
              { where: { sellerId: item.id } },
              { transaction: dbTransaction },
            );
          }),
        );
      }

      await dbTransaction.commit();
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(error?.message || 'Something Wrong');
    }
  }
};
