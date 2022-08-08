const shortid = require('shortid-36');
const { Sequelize } = require('sequelize');
const jne = require('../../../../../helpers/jne');
const jwtSelector = require('../../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../../helpers/snakecase-converter');
const {
  Order,
  Seller,
  OrderTax,
  OrderLog,
  Location,
  sequelize,
  OrderBatch,
  OrderDetail,
  OrderAddress,
  SellerAddress,
  OrderDiscount,
  SellerDetail,
} = require('../../../../models');

module.exports = class {
  constructor({ request }) {
    this.jne = jne;
    this.order = Order;
    this.seller = Seller;
    this.op = Sequelize.Op;
    this.request = request;
    this.batch = OrderBatch;
    this.location = Location;
    this.orderTax = OrderTax;
    this.orderLog = OrderLog;
    this.address = SellerAddress;
    this.orderDetail = OrderDetail;
    this.sellerDetail = SellerDetail;
    this.orderAddress = OrderAddress;
    this.orderDiscount = OrderDiscount;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.createOrder();

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  async createOrder() {
    try {
      const { body } = this.request;
      const seller = await jwtSelector({ request: this.request });

      const sellerData = await this.seller.findOne({ where: { id: seller.id } });
      const sellerDetail = await this.sellerDetail.findOne({ where: { id: seller.id } });
      const sellerAddress = await this.address.findOne({
        where: { id: body.seller_location_id, sellerId: seller.id },
        include: [
          {
            model: this.location,
            as: 'location',
            required: true,
          },
        ],
      });

      const payload = {
        seller: {
          ...sellerData,
          ...sellerDetail,
          ...sellerAddress,
        },
      };

      return payload;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async createBatch() {
    const dbTransaction = await sequelize.transaction();

    try {
      const { body } = this.request;
      this.createBatch = await this.batch.create(
        {
          expedition: body.type,
          sellerId: this.sellerData?.id,
          batchCode: `B${body?.order_items?.length}${shortid.generate()}`,
          totalOrder: body?.order_items?.length || 0,
          totalOrderProcessed: 0,
          totalOrderSent: 0,
          totalOrderProblem: 0,
        },
        { transaction: dbTransaction },
      );

      await dbTransaction.commit();
    } catch (error) {
      await dbTransaction.rollback();
      throw new Error(error);
    }
  }
};
