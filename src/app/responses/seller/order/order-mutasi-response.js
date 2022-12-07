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
    return this.process();
  }

  async process() {
    const limit = 10;
    const offset = 0;
    const { query } = this.request;
    const search = this.querySearch();
    const seller = await jwtSelector({ request: this.request });
    const whereCondition = query?.batch_id
      ? { sellerId: seller.id, batchId: query.batch_id }
      : { sellerId: seller.id };

    const total = await this.orderDetail.count({ where: {
        sellerId: seller.id,
      },
      include: [{
        model: Order,as: "order",
        where: {
          status: {
            [this.op.notIn]: ['WAITING_PICKUP', 'PROCESSED', 'PROBLEM'],
          },
        }
      }]

    });

    const nextPage = (
      (parseInt(query.page, 10) - parseInt(1, 10)) * parseInt(10, 10)
    ) || parseInt(offset, 10);

    return new Promise((resolve, reject) => {
      try {
        this.orderDetail.findAll({
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
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          const mapped = result?.map((item) => ({
            ...item,
            order: this.converter.objectToSnakeCase(item?.order) || null,
            receiver_address: this.converter.objectToSnakeCase(item?.receiver_address) || null,
            seller_address: {
              ...item.seller_address,
              location: this.converter.objectToSnakeCase(item?.seller_address?.location) || null,
            },
          }));

          if (mapped.length > 0) {
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
    const condition = {};

    if (query?.keyword) {
      condition[this.op.or] = {
        resi: { [this.op.substring]: query?.keyword?.toUpperCase() || '' },
      };
    }

    // if (query?.status) {
      // condition.status = query.status;
      condition.status = {
        [this.op.notIn]: [
          'WAITING_PICKUP', 'PROCESSED', 'PROBLEM',
        ],
      };
    // }

    if (query?.type) {
      condition.is_cod = query.type === 'cod';
    }

    if (query?.date_start || query?.date_end) {
      condition.createdAt = {
        [this.op.between]: [
          moment(`${query?.date_start}`).startOf('day').format(),
          moment(`${query?.date_end}`).endOf('day').format(),
        ],
      };
    }

    return condition;
  }
};
