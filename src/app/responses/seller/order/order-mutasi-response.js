const moment = require('moment');
const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const jwtSelector = require('../../../../helpers/jwt-selector');
const {
  Order,
  OrderDetail,
  OrderAddress,
  SellerAddress,
  Location,
  OrderLog,
  OrderHistory,
  TrackingHistory,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.order = Order;
    this.op = Sequelize.Op;
    this.request = request;
    this.location = Location;
    this.orderLog = OrderLog;
    this.orderDetail = OrderDetail;
    this.orderAddress = OrderAddress;
    this.sellerAddress = SellerAddress;
    this.converter = snakeCaseConverter;
    this.orderHistory = OrderHistory;
    this.trackingHistory = TrackingHistory;
    return this.process();
  }

  async process() {
    function getSellerReceivedAmount(item) {
      const amount = '';
      let ongkirReturned = 0.00;
      ongkirReturned = item.order.status === 'CANCELED' || 'WAITING_PICKUP' || 'PROCESSED' ? 0.00 : parseFloat(item.seller_received_amount);
      if (item.order.isCod && (item.order.status === 'RETURN_TO_SELLER')) {
        ongkirReturned = -1 * parseFloat(item.shipping_calculated);
      }
      if (item.order.isCod && (item.order.status === 'DELIVERED')) {
        ongkirReturned = 1 * parseFloat(item.seller_received_amount);
      }
      if (!(item.order.isCod)) {
        ongkirReturned = item.order.status === 'CANCELED' ? 0.00 : (-1 * parseFloat(item.shipping_calculated));
        // ongkirReturned = -1 * parseFloat(item.shipping_calculated);
      }

      return String(ongkirReturned.toFixed(2));
    }

    let limit = 10;
    const offset = 0;
    const { query } = this.request;
    const search = this.querySearch();
    const seller = await jwtSelector({ request: this.request });
    const whereCondition = query?.batch_id
      ? { sellerId: seller.id, batchId: query.batch_id }
      : { sellerId: seller.id };
    console.log('order mutasi response');
    // const total = await this.orderDetail.count({ where: {
    //     sellerId: seller.id,
    //   },
    //   include: [{
    //     model: Order,as: "order",
    //     where: {
    //       status: {
    //         [this.op.notIn]: ['WAITING_PICKUP', 'PROCESSED', 'PROBLEM'],
    //       },
    //     }
    //   }]
    //
    // });

    const nextPage = (
      (parseInt(query.page, 10) - parseInt(1, 10)) * parseInt(10, 10)
    ) || parseInt(offset, 10);

    return new Promise((resolve, reject) => {
      try {
        if (query.limit) {
          limit = parseInt(query.limit, 10);
        } else {
          limit = null;
        }
        this.orderDetail.findAndCountAll({
          attributes: [
            'orderId',
            'totalItem',
            'notes',
            'weight',
            'volume',
            'goodsContent',
            'shippingCharge',
            'useInsurance',
            'insuranceAmount',
            'sellerReceivedAmount',
            'codFee',
            'goodsPrice',
            'codFeeAdmin',
            'shippingCalculated',
          ],
          include: [

            {
              model: this.orderHistory,
              as: 'history',
              required: false,
              attributes: [
'deltaCredit',
              ],
            },
            {
              model: this.trackingHistory,
              as: 'tracking',
              required: true,
              attributes: [
                'cnote_raw',
                'detail_raw',
                'history_raw',
                'cnote_pod_date',
                'cnote_pod_status',
                'cnote_pod_code',
                'cnote_last_status',
                'cnote_estimate_delivery',
                'createdAt',
                'updatedAt',
                'deletedAt',
              ],
            },
            {
              model: this.order,
              as: 'order',
              required: true,
              where: search,
              attributes: [
                'orderCode',
                'resi',
                'orderDate',
                'orderTime',
                'expedition',
                'serviceCode',
                'isCod',
                'status',
                'createdAt',
                'updatedAt',
                'deletedAt',
              ],
              include: [
                {
                  model: this.orderAddress,
                  as: 'receiverAddress',
                  required: true,
                  attributes: [
                    ['id', 'receiver_id'],
                    'receiverName',
                  ],
                },
              ],
            },
            {
              model: this.sellerAddress,
              as: 'sellerAddress',
              required: false,
              attributes: [
                ['id', 'seller_address_id'],
                'address',
                'picName',
                'picPhoneNumber',
              ],
              include: [
                {
                  model: this.location,
                  as: 'location',
                  required: false,
                  attributes: [
                    ['id', 'location_id'],
                    'province',
                    'city',
                    'district',
                    'subDistrict',
                    'postalCode',
                  ],
                },
              ],
            },
          ],
          where: whereCondition,
          order: [['id', 'DESC']],
          limit: limit,
          offset: nextPage,
        }).then((response) => {
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response.rows)),
          );

          const mapped = result?.map((item) => ({
            ...item,
            order: this.converter.objectToSnakeCase(item?.order) || null,
            receiver_address: this.converter.objectToSnakeCase(item?.order.receiverAddress) || null,
            seller_received_amount: getSellerReceivedAmount(item),
            // item.order.status === 'CANCELED' || 'WAITING_PICKUP' || 'PROCESSED' ? '0.00' : item.seller_received_amount,
            seller_address: {
              ...item.seller_address,
              location: this.converter.objectToSnakeCase(item?.seller_address?.location) || null,
            },
          }));

          if (mapped.length > 0) {
            resolve({
              data: mapped,
              meta: {
                total: response.count,
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
                  total: response.count,
                  total_result: mapped.length,
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
    // const condition = {};

    // if (query?.keyword) {
    //   condition[this.op.or] = {
    //     resi: { [this.op.substring]: query?.keyword?.toUpperCase() || '' },
    //   };
    // }

    if (query?.filter_by === 'DATE') {
      filtered = {
        '$tracking.cnote_pod_date$': {
          [this.op.between]: [
            moment(query.date_start).startOf('day').format(),
            moment(query.date_end).endOf('day').format(),
          ],
        },
      };
    }

    if (query.filter_by === 'MONTH') {
      filtered = {
        '$tracking.cnote_pod_date$': {
          [this.op.between]: [
            moment(query.date_start).startOf('month').format(),
            moment(query.date_end).endOf('month').format(),
          ],
        },
      };
    }
    if (query.filter_by === 'YEAR') {
      filtered = {
        '$tracking.cnote_pod_date$': {
          [this.op.between]: [
            moment(query.date_start).startOf('year').format(),
            moment(query.date_end).endOf('year').format(),
          ],
        },
      };
    }
    if (query.filter_by === 'ALL') {
      // filtered = {
      //   '$tracking.cnote_pod_date$': {
      //     [this.op.between]: [
      //       // moment(query.date_start).startOf('year').format(),
      //       // moment(query.date_end).endOf('year').format(),
      //     ],
      //   },
      // };
    }
    //   condition.status = {
    //     [this.op.notIn]: [
    //       'WAITING_PICKUP', 'PROCESSED', 'PROBLEM',
    //     ],
    //   };
    //
    // if (query?.type) {
    //   condition.is_cod = query.type === 'cod';
    // }

    // return condition;

    const condition = {
      [this.op.and]: {
        ...filtered,
      },
      // is_cod: true,
      status: {
        [this.op.in]: [
          'DELIVERED',
          'RETURN_TO_SELLER',
        ],
      },
    };

    return query?.filter_by ? condition : {};
  }
};
