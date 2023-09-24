const moment = require('moment');
const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { CreditHistory, SellerDetail, Seller, Order, OrderDetail } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.op = Sequelize.Op;
    this.request = request;
    this.credit = CreditHistory;
    this.order = Order;
    this.seller = Seller;
    this.sellerDetail = SellerDetail;
    this.orderDetail = OrderDetail;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const limit = 10;
    const offset = 0;
    const { query } = this.request;
    const search = this.querySearch();
    const total = await this.credit.count();

    const nextPage = (
      (parseInt(query.page, 10) - parseInt(1, 10)) * parseInt(10, 10)
    ) || parseInt(offset, 10);

    return new Promise((resolve, reject) => {
      try {
        this.order.findAll({
          attributes: [
            ['id', 'order_id'],
            'resi',
            'expedition',
            'service_code',
            'is_cod',
            'status',
            'updated_at'
          ],
          include: [
            {
              model: this.orderDetail,
              as: 'detail',
              attributes: [
                'id',
                'seller_id',
                'seller_received_amount',
              ],
              include: [
                {
                  model: this.seller,
                  as: 'seller',
                  attributes: [
                    'id',
                    'name',
                    'email'
                  ],
                },
              ],
            },
          ],
          where: { ...search },
          order: [['id', 'DESC']],
          limit: parseInt(query.limit, 10) || parseInt(limit, 10),
          offset: nextPage,
        }).then((response) => {
          // console.log('response : ', response);
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          const mapped = result?.map((item) => ({
            ...item,
            // type: item?.topup ? 'TOPUP' : 'WITHDRAW',
            // description: item?.topup ? 'Topup Saldo' : 'Tarik Saldo',
          }));

          if (mapped.length > 0) {
            console.log('map lengthe : ', mapped.length)
            resolve({
              data: mapped,
              meta: {
                total,
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
                  total,
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
      [this.op.or]: {
        status: { [this.op.eq]: query.status || '' },
      },
      [this.op.and]: {
        ...filtered,
      },
    };

    return query?.status || query?.filter_by ? condition : {};
  }
};
