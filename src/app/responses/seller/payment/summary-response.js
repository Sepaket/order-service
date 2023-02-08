const moment = require('moment');
const { Sequelize } = require('sequelize');
const jwtSelector = require('../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { formatCurrency } = require('../../../../helpers/currency-converter');
const {
  CreditHistory,
  SellerDetail,
  OrderDetail,
  Order,
  OrderHistory,
} = require('../../../models');
const sequelize = require('sequelize');

module.exports = class {
  constructor({ request }) {
    this.op = Sequelize.Op;
    this.request = request;
    this.order = Order;
    this.credit = CreditHistory;
    this.orderDetail = OrderDetail;
    this.sellerDetail = SellerDetail;
    this.orderHistory = OrderHistory;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    try {
      const search = this.querySearch();
      const seller = await jwtSelector({ request: this.request });
      this.sellerId = seller?.id;
      this.search = search;

      const creditSeller = await this.creditSeller();
      const creditReferral = await this.creditReferral();
      const topupPending = await this.creditPending({ status: 'PENDING', selector: 'topup' });
      const withdrawPending = await this.creditPending({ status: 'PENDING', selector: 'withdraw' });
      const totalTopup = await this.totalTransaction({ selector: 'topup', status: 'PAID' });
      const totalWithdraw = await this.totalTransaction({ selector: 'withdraw', status: 'COMPLETED' });
      const totalTopupValue = await this.totalCredit({ selector: 'topup', status: 'PAID' });
      const totalWithdrawValue = await this.totalCredit({ selector: 'withdraw', status: 'COMPLETED' });
      const orderCodProfitDone = await this.orderProfit({ status: 'DELIVERED', isCod: true });
      const orderCodProfitUndone = await this.orderProfit({ status: 'UNDELIVERED', isCod: true });
      const orderNonCodProfitDone = await this.orderProfit({ status: 'DELIVERED', isCod: false });
      const orderNonCodProfitUndone = await this.orderProfit({ status: 'UNDELIVERED', isCod: false });
      const orderProfit = await this.orderProfit({ status: '', isCod: true });
      const shippingChargeCodPaid = await this.orderProfitShipping({ isCod: true });
      const shippingChargeNonCodPaid = await this.orderProfitShipping({ isCod: false });

      return {
        credit: {
          raw: creditSeller || 0,
          formatted: formatCurrency(creditSeller, 'Rp.'),
        },
        credit_referral: {
          raw: creditReferral || 0,
          formatted: formatCurrency(creditReferral, 'Rp.'),
        },
        credit_pending: {
          raw: topupPending || 0,
          formatted: formatCurrency(topupPending, 'Rp.'),
        },
        withdraw_pending: {
          raw: withdrawPending || 0,
          formatted: formatCurrency(withdrawPending, 'Rp.'),
        },
        total_topup: totalTopup || 0,
        total_topup_value: {
          raw: totalTopupValue || 0,
          formatted: formatCurrency(totalTopupValue, 'Rp.'),
        },
        total_withdraw: totalWithdraw || 0,
        total_withdraw_value: {
          raw: totalWithdrawValue || 0,
          formatted: formatCurrency(totalWithdrawValue, 'Rp.'),
        },
        cod_profit_done: {
          raw: orderCodProfitDone,
          formatted: formatCurrency(orderCodProfitDone, 'Rp.'),
        },
        cod_profit_pending: {
          raw: orderCodProfitUndone,
          formatted: formatCurrency(orderCodProfitUndone, 'Rp.'),
        },
        total_profit: {
          raw: orderProfit,
          formatted: formatCurrency(orderProfit, 'Rp.'),
        },
        shipping_charge_paid_cod: {
          raw: shippingChargeCodPaid,
          formatted: formatCurrency(shippingChargeCodPaid, 'Rp.'),
        },
        shipping_charge_paid_non_cod: {
          raw: shippingChargeNonCodPaid,
          formatted: formatCurrency(shippingChargeNonCodPaid, 'Rp.'),
        },
        non_cod_profit_done: {
          raw: orderNonCodProfitDone,
          formatted: formatCurrency(orderNonCodProfitDone, 'Rp.'),
        },
        non_cod_profit_pending: {
          raw: orderNonCodProfitUndone,
          formatted: formatCurrency(orderNonCodProfitUndone, 'Rp.'),
        },
      };
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  async creditSeller() {
    try {
      const seller = await this.sellerDetail.findOne({
        where: {
          sellerId: this.sellerId,
          ...this.search,
        },
      });
      return seller?.credit;
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  async creditReferral() {
    try {
      console.log('1')

      const referral = await this.orderHistory.sum(`referral_credit`, {
        where: {
          referralId: this.sellerId,
          // status,
          ...this.search,
        },
      });
      console.log(referral)
      return referral || 0;
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  async creditPending({ status, selector }) {
    try {
      const credit = await this.credit.sum(`${selector}`, {
        where: {
          sellerId: this.sellerId,
          status,
          ...this.search,
        },
      });

      return credit;
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  async totalTransaction({ selector, status }) {
    try {
      let condition = {};
      if (selector === 'topup') {
        condition = {
          topup: {
            [this.op.ne]: null,
          },
        };
      }

      if (selector === 'withdraw') {
        condition = {
          withdraw: {
            [this.op.ne]: null,
          },
        };
      }

      const credit = await this.credit.count({
        where: {
          sellerId: this.sellerId,
          status,
          ...condition,
          ...this.search,
        },
      });

      return credit;
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  async totalCredit({ selector, status }) {
    try {
      const credit = await this.credit.sum(`${selector}`, {
        where: {
          sellerId: this.sellerId,
          status,
          ...this.search,
        },
      });

      return credit;
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  async orderProfit({ status, isCod }) {
    try {
      let statusCondition = {};
      let codCondition = {};
      if (status !== '') {
        if (status === 'DELIVERED') {
          statusCondition = {
            status: 'DELIVERED',
          };
        }

        if (status === 'UNDELIVERED') {
          statusCondition = {
            status: {
              [this.op.ne]: 'DELIVERED',
            },
          };
        }
      }

      if (isCod !== '') {
        codCondition = { isCod };
      }

      const order = await this.orderDetail.findAll({
        groupBy: 'orderDetail.orderId',
        where: {
          sellerId: this.sellerId,
          ...this.search,
        },
        include: [
          {
            model: this.order,
            as: 'order',
            required: true,
            where: {
              ...codCondition,
              ...statusCondition,
            },
          },
        ],
      });

      let result = 0;
      order?.forEach((item) => {
        if (item.order.status === 'CANCELED') {
          console.log(item.order.status);
        } else if (item.order.status === 'RETURN_TO_SELLER') {
          console.log(item.order.status);
        } else if (item.order.status === 'PROBLEM') {
          console.log(item.order.status);
        } else { // SISA NYA DISINI ADALAH WAIITING_PICKUP
          result += parseFloat(item.sellerReceivedAmount);
        }
      });

      return parseFloat(result);
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  async orderProfitShipping({ isCod }) {
    try {
      const order = await this.orderDetail.findAll({
        groupBy: 'orderDetail.orderId',
        where: {
          sellerId: this.sellerId,
          ...this.search,
        },
        include: [
          {
            model: this.order,
            as: 'order',
            required: true,
            where: {
              isCod,
              status: {
                [this.op.notIn]: ['RETURN_TO_SELLER', 'CANCELED'],
              },
            },
          },
        ],
      });

      let result = 0;
      order?.forEach((item) => {
        result += parseFloat(item.shippingCharge, 10);
      });

      return parseFloat(result);
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  querySearch() {
    const { query } = this.request;
    let filtered = {};
    if (query?.filter_by === 'DATE_RANGE') {
      filtered = {
        updatedAt: {
          [this.op.between]: [
            moment(query.date_start).tz('Asia/Jakarta').startOf('day').format(),
            moment(query.date_end).endOf('day').format(),
          ],
        },
      };
    }

    if (query.filter_by === 'MONTH') {
      filtered = {
        updatedAt: {
          [this.op.between]: [
            moment(query.month, 'M').startOf('month').format(),
            moment(query.month, 'M').endOf('month').format(),
          ],
        },
      };
    }

    if (query.filter_by === 'YEAR') {
      filtered = {
        updatedAt: {
          [this.op.between]: [
            moment(query.year, 'YYYY').startOf('year').format(),
            moment(query.year, 'YYYY').endOf('year').format(),
          ],
        },
      };
    }

    const condition = {
      [this.op.and]: {
        ...filtered,
      },
    };

    return query?.filter_by ? condition : {};
  }
};
