const jne = require('../../../../helpers/jne');
const orderStatus = require('../../../../constant/order-status');
const {
  Order,
  OrderLog,
  sequelize,
  OrderDetail,
  OrderAddress,
  SellerDetail,
  OrderBackground,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.jne = jne;
    this.order = Order;
    this.request = request;
    this.orderLog = OrderLog;
    this.orderAddress = OrderAddress;
    this.orderDetail = OrderDetail;
    this.sellerDetail = SellerDetail;
    this.background = OrderBackground;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('jne cancel');
        const { params } = this.request;

        const order = await this.order.findOne({
          where: { id: params.id },
          include: [{ model: this.orderDetail, as: 'detail', required: true }],
        });

        if (order && order.status === 'CANCELED') throw new Error('Order ini sudah di batalkan');

        const person = await this.orderAddress.findOne({
          where: { orderId: order?.id },
        });
        // await this.jne.cancel({ resi: order.resi, pic: person.senderName });
        console.log('cancel reno');
        // console.log(order)
        this.insertLog(order);

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  async insertLog(order) {
    console.log('inside insertLog(order)')
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
          resi: order.resi,
          deltaCredit: order.detail.shippingCalculated,
          sellerId: order.detail.sellerId,
          expedition: order.expedition,
          serviceCode: order.serviceCode,
        },
        { transaction: dbTransaction },
      );

      await this.background.update(
        { isExecute: true },
        { where: { resi: order.resi } },
        { transaction: dbTransaction },
      );

      const shippingCalculated = order?.detail?.shippingCalculated;
      const seller = await this.sellerDetail.findOne({
        where: { sellerId: order.detail.sellerId },
      });

      if (!order.isCod) {

        const creditValue = seller.credit === 'NaN' ? 0 : seller.credit;
        const credit = parseFloat(creditValue) + parseFloat(shippingCalculated);

        await this.sellerDetail.update(
          { credit },
          { where: { sellerId: seller.sellerId } },
          { transaction: dbTransaction },
        );
      } else {
        console.log('canceled order is COD');
      }

      await dbTransaction.commit();
      console.log('after commit');
    } catch (error) {
      console.log('errr');
      await dbTransaction.rollback();
      throw new Error(error?.message || 'Something Wrong');
    }
  }
};
