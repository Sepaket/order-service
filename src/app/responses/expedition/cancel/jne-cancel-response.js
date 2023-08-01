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

        const { params } = this.request;
        console.log('jne cancel');
        console.log(params.id);
        const order = await this.order.findOne({
          where: { id: params.id },
          include: [{ model: this.orderDetail, as: 'detail', required: true }],
        });

        if (order && order.status === 'CANCELED') throw new Error('Order ini sudah di batalkan');

        const person = await this.orderAddress.findOne({
          where: { orderId: order?.id },
        });
        await this.jne.cancel({ resi: order.resi, pic: person.senderName });
        // console.log('cancel reno');
        // console.log(order)
        await this.insertLog(order);
        await this.processSaldo(order);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  async processSaldo(order) {
    const dbTransaction = await sequelize.transaction();
    try {
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
        await dbTransaction.commit();
      } else {
        console.log('canceled order is COD');
      }
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async insertLog(order) {
    console.log('inside insertLog(order)')
    console.log(order.id);
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
      await dbTransaction.commit();
      console.log('after commit');
    } catch (error) {
      console.log('errr');
      await dbTransaction.rollback();
      throw new Error(error?.message || 'Something Wrong');
    }
  }
};
