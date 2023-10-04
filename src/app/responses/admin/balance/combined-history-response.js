const moment = require('moment');
const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { CreditHistory, SellerDetail, Seller, Order, OrderDetail, OrderHistory } = require('../../../models');
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
    this.orderHistory = OrderHistory;
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
            {
              model: this.orderHistory,
              as: 'history',
              attributes: [
                'id',
                'order_id',
                'delta_credit',
                'is_execute',
              ],
            },
          ],
          where: { ...search },
          order: [['id', 'DESC']],
          // limit: parseInt(query.limit, 10) || parseInt(limit, 10),
          // offset: nextPage,
        }).then((response) => {
          // console.log('response : ', response);
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          const mapped = result?.map((item) => ({
            // ...item,
            id: item.order_id,
            user: item.detail.seller?.name,
            nominal: item?.history?.delta_credit ? item?.history?.delta_credit : '0',
            deskripsi: item.status,
            tanggal: item.updated_at,
            jam: item.updated_at,
            tipe: item.status,
            status: item?.history?.is_execute ? 'PAID' : 'NOT YET PAID',
            // type: item?.topup ? 'TOPUP' : 'WITHDRAW',
            // description: item?.topup ? 'Topup Saldo' : 'Tarik Saldo',
          }));

          if (mapped.length > 0) {
            // console.log('mapped : ', mapped[0]);
            // console.log('result : ', result[0]);
            console.log('map lengthe : ', mapped.length)


            try {
              this.credit.findAll({
                attributes: [
                  ['id', 'credit_id'],
                  'seller_id',
                  'status',
                  'topup',
                  'withdraw',
                  'updatedAt',
                ],
                include: [
                  {
                    model: this.sellerDetail,
                    as: 'seller',
                    attributes: [
                      'id',
                      'seller_id',
                      'credit',
                    ],
                    include: [
                      {
                        model: this.seller,
                        as: 'seller',
                        attributes: [
                          'id',
                          'name',
                        ],
                      },
                    ],
                  },
                ],
                where: { ...search },
                order: [['id', 'DESC']],
                // limit: parseInt(query.limit, 10) || parseInt(limit, 10),
                // offset: nextPage,
              }).then((response2) => {


                const result2 = this.converter.arrayToSnakeCase(
                  JSON.parse(JSON.stringify(response2)),
                );


                const mapped2 = result2?.map((item) => ({
                  // ...item,
                  id: item.credit_id,
                  user: item.seller?.seller.name,
                  nominal: item.topup ? item.topup : item.withdraw,
                  deskripsi: item.topup ? 'TOPUP' : 'WITHDRAW',
                  tanggal: item.updated_at,
                  jam: item.updated_at,
                  tipe: item.topup ? 'TOPUP' : 'WITHDRAW',
                  status: item.status,
                }));

                console.log('mapped 2 : ', mapped2);


                mapped.concat(mapped2);

                resolve({
                  data: mapped,
                  meta: {
                    // total,
                    total_result: mapped.length,
                    total_order_count: mapped.length - mapped2.length,
                    total_credit_count: mapped2.length,
                    limit: parseInt(query.limit, 10) || limit,
                    page: parseInt(query.page, 10) || (offset + 1),
                  },
                });

              });


            } catch (error) {
              reject(error);
            }













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
