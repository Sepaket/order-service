const moment = require('moment');
const { Op } = require('sequelize');
const { Order, OrderDetail } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');
const daysBetweenDates = require('../../../../helpers/days-between-dates');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.order = Order;
    this.setDates();
    return this.process();
  }

  async process() {
    try {
      await this.getOrders();
      return this.mapData();
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  mapData() {
    const days = daysBetweenDates(this.startDate, this.endDate);
    const data = days.map((day) => ({
      cod: Math.round(this.getCodOnDate(day)),
      non_cod: Math.round(this.getNonCodOnDate(day)),
      date: day.format(),
    }));

    return data;
  }

  getDataOnDate(date, isCode = true) {
    // console.log(this.orderList);
    const getData = this.orderList?.filter((orderList) => {
      const orderListDate = moment(orderList.createdAt).format('Y-MM-DD');

      const searchDate = date.format('Y-MM-DD');
      if (orderListDate === searchDate) {
        console.log(orderListDate);
        console.log(searchDate);
        console.log(isCode);
        console.log(orderList.id);
        console.log("==============");
      }

      return orderListDate === searchDate && orderList.isCod === isCode;
    });
    if (getData) {
      if (this.request.query.type === 'qty') {
        // console.log(getData);
        // console.log(getData?.length);
        return getData?.length;
      }

      if (this.request.query.type === 'amount') {
        return getData?.reduce(
          (carry, data) => carry + parseFloat(data.detail.sellerReceivedAmount), 0,
        );
      }
    }

    return 0;
  }

  getCodOnDate(date) {
    const r = this.getDataOnDate(date, true);
    // console.log(r);
    return r;
  }

  getNonCodOnDate(date) {
    return this.getDataOnDate(date, false);
  }

  async getOrders() {
    try {
      const seller = await jwtSelector({ request: this.request });
      console.log(seller.id);
      const orderList = await this.order.findAll({
        attributes: ['id', 'isCod', 'createdAt'],
        where: {
          '$detail.seller_id$': seller.id,
          ...this.querySearch(),
        },
        include: [{
          model: OrderDetail,
          as: 'detail',
        }],
      });

      if (orderList) this.orderList = orderList;
      console.log(orderList.length);
    } catch (error) {
      throw new Error(error);
    }
  }

  setDates() {
    const { query } = this.request;
    const now = query.date ? query.date : new Date();
    this.startDate = moment(now).subtract(30, 'days').startOf('day');
    this.endDate = moment(now).endOf('day');
  }

  querySearch() {
    const { query } = this.request;
    if (query.date) {
      const condition = {
        createdAt: {
          [Op.between]: [
            this.startDate.format(),
            this.endDate.format(),
          ],
        },
      };

      return condition;
    }

    return {};
  }
};
