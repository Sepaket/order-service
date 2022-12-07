const moment = require('moment');
const { Op } = require('sequelize');
const { CreditHistory } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const httpErrors = require('http-errors');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.credithistory = CreditHistory;
    this.converter = snakeCaseConverter;
    return this.process();
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

      // return order;
      return parseFloat(result);
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  async process() {
    const limit = 10;
    const offset = 0;
    const { query } = this.request;
    console.log("shipping paid cod");
    const shippingChargeCodPaid = await this.orderProfitShipping({ isCod: true });

    const seller = await jwtSelector({ request: this.request });
    return new Promise(async (resolve, reject) => {
      try {
        this.seller = await jwtSelector({ request: this.request });

        this.credithistory.findAll({
          where: {
            seller_id: seller.id,
            status: 'COMPLETED',
            ...this.querySearch(),
          },
          // include: [{
          //   model: OrderDetail,
          //   as: 'detail',
          // }],
        }).then((response) => {
          // resolve(response);
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );
          const mapped = result?.map((item) => ({
            ...item,
            type: item?.topup ? 'TOPUP' : 'WITHDRAW',
            description: item?.topup ? 'Topup Saldo' : 'Tarik Saldo',
          }));
          if (mapped.length > 0) {
            resolve({
              data: mapped,
              meta: {
                // total,
                total_result: mapped.length,
                limit: parseInt(query.limit, 10) || limit,
                page: parseInt(query.page, 10) || (offset + 1),
              },
            });
          } else {
            reject(httpErrors(404, 'No Data Found', {
              data: {
                data: [],
                meta: {
                  // total,
                  total_result: 0,
                  limit: parseInt(query.limit, 10) || limit,
                  page: parseInt(query.page, 10) || (offset + 1),
                },
              },
            }));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  querySearch() {
    const { query } = this.request;
    if (query.start_date && query.end_date) {
      const condition = {
        createdAt: {
          [Op.between]: [
            moment(query.start_date).startOf('day').format(),
            moment(query.end_date).endOf('day').format(),
          ],
        },
      };

      return condition;
    }

    return {};
  }
};
