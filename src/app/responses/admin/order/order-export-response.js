const moment = require('moment');
const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
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
    this.converter = snakeCaseConverter;
    this.seller = Seller;
    return this.process();
  }

  async process() {
    const search = this.querySearch();

    return new Promise((resolve, reject) => {
      try {
        this.orderDetail.findAndCountAll({
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
                'pod_status',
                'orderDate',
                'orderTime',
                'createdAt',
                'updatedAt',
              ],
              include : [
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
                      paranoid: false,
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
              model: this.seller,
              as: 'seller',
              required: true,
              attributes: [
                'name','email','phone',
              ],
            },
            {
              model: this.orderTax,
              as: 'tax',
              required: false,
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

          ],
          where: { ...search },
          order: [['id', 'DESC']],
        }).then((response) => {
          console.log('count : ', response.count)
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response.rows)),
          );

          const mapped = result?.map((item) => {
            const itemResponse = item;

            let vatCalculated = item?.tax?.vatTax ? item?.tax?.vatTax : 0;
            if (item?.tax && item?.tax?.vatType === 'PERCENTAGE') {
              vatCalculated = (
                parseFloat(item?.shipping_charge)
                * parseFloat(item?.tax?.vatTax)
              ) / 100;
            }

            const codFeeCalculated = parseFloat(item.cod_fee_admin);
            const shippingDiscount = (
              parseFloat(item.shipping_charge) - parseFloat(item.discount.value)
            );

            let shippingChargeTotal = (parseFloat(item.shipping_calculated));
            // console.log('shipping --- ');
            // console.log(item);
            // console.log(shippingChargeTotal);
            itemResponse.shipping_charge_discount = Number(shippingDiscount).toFixed(2);
            itemResponse.shipping_charge_total = Number(shippingChargeTotal).toFixed(2);
            itemResponse.order = this.converter.objectToSnakeCase(item.order);

            itemResponse.cod_value = item.cod_fee || 0;
            itemResponse.tax = this.converter.objectToSnakeCase(item.tax);
            itemResponse.vat_calculated = Number(vatCalculated).toFixed(2);
            itemResponse.receiver_address = {
              ...this.converter.objectToSnakeCase(item?.receiver_address),
              location: this.converter.objectToSnakeCase(item?.receiver_address?.location) || null,
            };

            delete itemResponse.cod_fee;

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
