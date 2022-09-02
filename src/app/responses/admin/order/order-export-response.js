const moment = require('moment');
const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const {
  Order,
  Location,
  OrderLog,
  OrderTax,
  OrderDetail,
  OrderAddress,
  SellerAddress,
  OrderDiscount,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.order = Order;
    this.op = Sequelize.Op;
    this.request = request;
    this.location = Location;
    this.orderLog = OrderLog;
    this.orderTax = OrderTax;
    this.orderDetail = OrderDetail;
    this.orderAddress = OrderAddress;
    this.sellerAddress = SellerAddress;
    this.orderDiscount = OrderDiscount;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const search = this.querySearch();

    return new Promise((resolve, reject) => {
      try {
        this.orderDetail.findAll({
          attributes: [
            'orderId',
            'totalItem',
            'batchId',
            'weight',
            'volume',
            'codFeeAdmin',
            'goodsPrice',
            'useInsurance',
            'insuranceAmount',
            'shippingCharge',
            'sellerReceivedAmount',
          ],
          include: [
            {
              model: this.order,
              as: 'order',
              required: true,
              attributes: [
                'orderCode',
                'resi',
                'expedition',
                'serviceCode',
                'isCod',
                'status',
                'pod_status',
                'orderDate',
                'orderTime',
                'createdAt',
                'updatedAt',
              ],
            },
            {
              model: this.orderTax,
              as: 'tax',
              required: true,
              attributes: [
                ['id', 'tax_id'],
                'taxAmount',
                'taxType',
                'vatTax',
                'vatType',
              ],
            },
            {
              model: this.orderDiscount,
              as: 'discount',
              required: true,
              attributes: [
                ['id', 'discount_id'],
                'value',
              ],
            },
            {
              model: this.orderAddress,
              as: 'receiverAddress',
              required: true,
              attributes: [
                ['id', 'receiver_id'],
                'senderName',
                'senderPhone',
                'receiverName',
                'receiverPhone',
                'receiverAddress',
                'receiverAddressNote',
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
          where: { ...search },
          order: [['id', 'DESC']],
        }).then((response) => {
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          const mapped = result?.map((item) => {
            const itemResponse = item;

            itemResponse.order.goods_price = 0;
            itemResponse.order = this.converter.objectToSnakeCase(item.order);
            itemResponse.order.cod_fee = item.cod_fee_admin;
            itemResponse.tax = this.converter.objectToSnakeCase(item.tax);
            itemResponse.receiver_address = {
              ...this.converter.objectToSnakeCase(item?.receiver_address),
              location: this.converter.objectToSnakeCase(item?.receiver_address?.location) || null,
            };

            return itemResponse;
          }) || [];

          if (mapped.length > 0) {
            resolve({
              data: mapped,
              meta: null,
            });
          } else {
            reject(httpErrors(404, 'No Data Found', {
              data: {
                data: [],
                meta: null,
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
    const { body } = this.request;
    const condition = {
      createdAt: {
        [this.op.between]: [
          moment(`${body?.date_start}`).startOf('day').format(),
          moment(`${body?.date_end}`).endOf('day').format(),
        ],
      },
    };

    return condition;
  }
};
