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
        const { body } = this.request;
        this.orderIds = body.ids.map((item) => {
          if (item.expedition === 'SICEPAT' && item.status === orderStatus.WAITING_PICKUP.text) return item.id;
          return null;
        }).filter((item) => item);

        if (this.orderIds.length < 1) {
          resolve(null);
          return;
        }

        const orders = await this.order.findAll({
          where: { id: this.orderIds, expedition: 'SICEPAT' },
        });

        this.orderNotCod = await this.order.findAll({
          where: { id: this.orderIds, isCod: false },
          include: [{ model: this.orderDetail, as: 'detail', required: true }],
        });

        this.resies = orders.map((item) => item.resi);

        const responseMap = orders.map((order) => ({
          id: order.id,
          resi: order.resi,
          status: true,
          message: 'OK',
        }));

        if (this.orderIds.length > 0) {
          const payload = orders.map((item) => ({ resi: item.resi }));
          await this.insertLog({ orders, payload });
        }

        resolve(responseMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  async insertLog(params) {
    const dbTransaction = await sequelize.transaction();

    try {
      const payloadLog = params.orders.map((item) => ({
        previousStatus: item.status,
        currentStatus: orderStatus.CANCELED.text,
        orderId: item.id,
      }));

      await this.order.update(
        { status: orderStatus.CANCELED.text },
        { where: { id: this.orderIds } },
        { transaction: dbTransaction },
      );

      await this.orderLog.bulkCreate(
        payloadLog,
        { transaction: dbTransaction },
      );

      await this.background.update(
        { isExecute: true },
        { where: { resi: this.resies } },
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
