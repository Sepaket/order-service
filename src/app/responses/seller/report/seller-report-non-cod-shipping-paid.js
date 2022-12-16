const moment = require('moment');
const { Op,
  Sequelize
} = require('sequelize');
const { Order, OrderDetail,
  Location,
  OrderLog,
  OrderAddress,
  SellerAddress
} = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const httpErrors = require('http-errors');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.order = Order;
    this.op = Sequelize.Op;
    this.location = Location;
    this.orderLog = OrderLog;
    this.orderDetail = OrderDetail;
    this.orderAddress = OrderAddress;
    this.sellerAddress = SellerAddress;
    this.converter = snakeCaseConverter;
    return this.process();
  }


  async process() {

    function getSellerReceivedAmount(item) {
      let amount = '';
      let ongkirReturned = 0.00;

      ongkirReturned = item.order.status === 'CANCELED' || 'WAITING_PICKUP' || 'PROCESSED' ? 0.00 : parseFloat(item.shipping_calculated);
      if (!item.order.isCod && (item.order.status === 'RETURN_TO_SELLER')) {

        ongkirReturned = -1 * parseFloat(item.shipping_calculated);
      }
      if (!(item.order.isCod)) {
        ongkirReturned = -1 * parseFloat(item.shipping_calculated);
      }
      return String(ongkirReturned.toFixed(2));
    }

    const limit = 10;
    const offset = 0;
    const { query } = this.request;
    const search = this.querySearch();
    const seller = await jwtSelector({ request: this.request });
    const whereCondition = query?.batch_id
      ? { sellerId: seller.id, batchId: query.batch_id }
      : { sellerId: seller.id };
    const nextPage = (
      (parseInt(query.page, 10) - parseInt(1, 10)) * parseInt(10, 10)
    ) || parseInt(offset, 10);
    return new Promise(async (resolve, reject) => {
      try {
        this.seller = await jwtSelector({ request: this.request });

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
              model: this.orderAddress,
              as: 'receiverAddress',
              required: true,
              attributes: [
                ['id', 'receiver_id'],
                'receiverName',
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
                'updatedAt',
                'createdAt',
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
          limit: parseInt(query.limit, 10) || parseInt(limit, 10),
          offset: nextPage,

        }).then((response) => {
          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  querySearch() {
    const { query } = this.request;
    let filtered = {};
    if (query?.filter_by === 'DATE') {
      filtered = {
        createdAt: {
          [this.op.between]: [
            moment(query.date_start).startOf('day').format(),
            moment(query.date_end).endOf('day').format(),
          ],
        },
      };
    }

    if (query.filter_by === 'MONTH') {
      filtered = {
        createdAt: {
          [this.op.between]: [
            moment(query.date_start).startOf('month').format(),
            moment(query.date_end).endOf('month').format(),
          ],
        },
      };
    }

    if (query.filter_by === 'YEAR') {
      filtered = {
        createdAt: {
          [this.op.between]: [
            moment(query.date_start).startOf('year').format(),
            moment(query.date_end).endOf('year').format(),
          ],
        },
      };
    }

    const condition = {
      [this.op.and]: {
        ...filtered,
      },
      is_cod: false,
      status: {
        [this.op.notIn]: ['RETURN_TO_SELLER', 'CANCELED']
        // [this.op.in]: [
        //   'PROCESSED', 'WAITING_PICKUP'
        // ],
      }
    };

    return query?.filter_by ? condition : {};
  }


  // querySearch() {
  //   const { query } = this.request;
  //   if (query.start_date && query.end_date) {
  //     const condition = {
  //       createdAt: {
  //         [Op.between]: [
  //           moment(query.start_date).startOf('day').format(),
  //           moment(query.end_date).endOf('day').format(),
  //         ],
  //       },
  //     };
  //
  //     return condition;
  //   }
  //
  //   return {};
  // }
};




// const moment = require('moment');
// const { Op } = require('sequelize');
// const { Order, OrderDetail
// } = require('../../../models');
// const jwtSelector = require('../../../../helpers/jwt-selector');
// const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
// const httpErrors = require('http-errors');
//
// module.exports = class {
//   constructor({ request }) {
//     this.request = request;
//     this.order = Order;
//     this.converter = snakeCaseConverter;
//     return this.process();
//   }
//
//
//   async process() {
//     const limit = 10;
//     const offset = 0;
//     const { query } = this.request;
//
//
//     const seller = await jwtSelector({ request: this.request });
//     return new Promise(async (resolve, reject) => {
//       try {
//         this.seller = await jwtSelector({ request: this.request });
//         this.order.findAll({
//           where: {
//             '$detail.seller_id$': seller.id,
//             status: {
//               // [Op.or]: ['PROCESSED', 'WAITING_PICKUP']
//               [Op.notIn]: ['RETURN_TO_SELLER', 'CANCELED'],
//             },
//             // status: 'PROCESSED',
//             isCod: false,
//             ...this.querySearch(),
//           },
//           include: [{
//             model: OrderDetail,
//             as: 'detail',
//           }],
//         }).then((response) => {
//           resolve(response);
//         });
//       } catch (error) {
//         reject(error);
//       }
//     });
//   }
//
//   querySearch() {
//     const { query } = this.request;
//     if (query.start_date && query.end_date) {
//       const condition = {
//         createdAt: {
//           [Op.between]: [
//             moment(query.start_date).startOf('day').format(),
//             moment(query.end_date).endOf('day').format(),
//           ],
//         },
//       };
//
//       return condition;
//     }
//
//     return {};
//   }
// };
