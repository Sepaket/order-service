const moment = require('moment');
const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const jwtSelector = require('../../../../helpers/jwt-selector');
const {
  Order,
  Location,
  OrderLog,
  OrderTax,
  OrderBatch,
  OrderDetail,
  OrderAddress,
  SellerAddress,
  OrderDiscount,
  Seller,
  TrackingHistory,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.order = Order;
    this.op = Sequelize.Op;
    this.request = request;
    this.batch = OrderBatch;
    this.location = Location;
    this.orderLog = OrderLog;
    this.orderTax = OrderTax;
    this.orderDetail = OrderDetail;
    this.orderAddress = OrderAddress;
    this.sellerAddress = SellerAddress;
    this.orderDiscount = OrderDiscount;
    this.seller = Seller;
    this.trackingHistory = TrackingHistory,
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const search = this.querySearch();
    const seller = await jwtSelector({ request: this.request });

    return new Promise((resolve, reject) => {
      try {
        this.orderDetail.findAll({
          attributes: [
            'orderId',
            'totalItem',
            'batchId',
            'weight',
            'volume',
            'codFee',
            'codFeeAdmin',
            'goodsPrice',
            'useInsurance',
            'insuranceAmount',
            'shippingCharge',
            'sellerReceivedAmount',
            'shippingCalculated',
            'createdAt',
            'updatedAt',
          ],
          include: [
            {
              model: this.batch,
              as: 'batch',
              required: true,
              attributes: [
                'batch_code',
              ],
            },
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
                // 'pod_status',
                'orderDate',
                'orderTime',
                'createdAt',
                'updatedAt',
              ],
              include: [
                {
                  model: this.orderAddress,
                  as: 'receiverAddress',
                  required: false,
                  paranoid: false,
                  attributes: [
                    ['id', 'address_receiver_id'],
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
                      paranoid: false,
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
            },
            {
              model: this.trackingHistory,
              as: 'tracking',
              required: false,
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
              model: this.seller,
              as: 'seller',
              required: true,
              attributes: [
                'name','email',
                'phone',
              ],
            },
            {
              model: this.sellerAddress,
              as: 'sellerAddress',
              required: true,
              paranoid: false,
              attributes: [
                ['id', 'seller_address_id'],
                'name',
                'picName',
                'picPhoneNumber',
                'address',
                'hideInResi',
                // 'senderPhone',
                // 'receiverName',
                // 'receiverPhone',
                // 'receiverAddress',
                // 'receiverAddressNote',
              ],
              include: [
                {
                  model: this.location,
                  as: 'location',
                  required: false,
                  paranoid: false,
                  attributes: [
                    ['id', 'location_id'],
                    'province',
                    'city',
                    'district',
                    'subDistrict',
                    'postalCode',
                    'jne_origin_code',
                    'jne_destination_code',
                    'sicepat_origin_code',
                    'sicepat_destination_code',
                    'ninja_origin_code',
                    'ninja_destination_code',
                  ],
                },
              ],
            },
          ],
          where: { ...search, sellerId: seller.id },
          order: [['id', 'DESC']],
        }).then((response) => {
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          const mapped = result?.map((item) => {
            const itemResponse = item;

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
    const condition = {};

    if (body?.batch_id && body?.batch_id !== '') condition.batch_id = body?.batch_id || '';
    if (body?.date_start && body?.date_start !== '') {
      condition.createdAt = {
        [this.op.between]: [
          moment(`${body?.date_start}`).startOf('day').format(),
          moment(`${body?.date_end}`).endOf('day').format(),
        ],
      };
    }

    return condition;
  }
};
