const { Sequelize } = require('sequelize');
const jne = require('../../../../helpers/jne');
const orderStatus = require('../../../../constant/order-status');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const {
  Location,
  Seller,
  Order,
  OrderLog,
  OrderDetail,
  OrderAddress,
  SellerAddress,
  OrderBackground,
  sequelize,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.jne = jne;
    this.order = Order;
    this.seller = Seller;
    this.op = Sequelize.Op;
    this.request = request;
    this.location = Location;
    this.orderLog = OrderLog;
    this.address = SellerAddress;
    this.orderDetail = OrderDetail;
    this.orderAddress = OrderAddress;
    this.background = OrderBackground;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.cancelOrder();

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  async cancelOrder() {
    try {
      const { body } = this.request;
      this.orderIds = body.ids.map((item) => {
        if (item.expedition === 'JNE' && item.status === orderStatus.WAITING_PICKUP.text) return item.id;
        return null;
      }).filter((item) => item);

      if (this.orderIds.length < 1) return null;

      const orders = await this.order.findAll({
        where: { id: this.orderIds, expedition: 'JNE' },
      });

      this.resies = orders.map((item) => item.resi);

      const orderAddresses = await this.orderAddress.findAll({
        where: { orderId: this.orderIds },
        include: [
          {
            model: this.location,
            as: 'location',
            required: false,
          },
        ],
      });

      const orderDetails = await this.orderDetail.findAll({
        where: { orderId: this.orderIds },
        include: [
          {
            model: this.seller,
            as: 'seller',
            required: true,
          },
          {
            model: this.address,
            as: 'sellerAddress',
            required: true,
            include: [
              {
                model: this.location,
                as: 'location',
                required: false,
              },
            ],
          },
        ],
      });

      const payload = orders.map((item) => {
        const orderDetail = orderDetails.find((detail) => detail.orderId === item.id);
        const orderAddress = orderAddresses.find((address) => address.orderId === item.id);

        return {
          order: item,
          orderDetail,
          orderAddress,
        };
      });

      const responseMap = orders.map((order) => ({
        id: order.id,
        resi: order.resi,
        status: true,
        message: 'OK',
      }));

      if (this.orderIds.length > 0) {
        const parameter = await this.paramsMapper({ payload });
        await this.insertLog({
          payload: parameter,
          orders,
        });
      }

      return responseMap;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
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
        { where: { id: { [this.op.in]: this.orderIds } } },
        { transaction: dbTransaction },
      );

      await this.background.update(
        { isExecute: true },
        { where: { resi: { [this.op.in]: this.resies } } },
        { transaction: dbTransaction },
      );

      await this.orderLog.bulkCreate(
        payloadLog,
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async paramsMapper({ payload }) {
    const mapped = payload.map((item) => {
      const parameter = this.parameterHandler({ payload: item });

      return Object.keys(parameter).reduce((accumulator, key) => {
        accumulator[key.toUpperCase()] = parameter[key];
        return accumulator;
      }, {});
    });

    return mapped;
  }
};
