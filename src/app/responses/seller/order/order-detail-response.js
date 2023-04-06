const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const tax = require('../../../../constant/tax');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const jwtSelector = require('../../../../helpers/jwt-selector');
const {
  Order,
  OrderDetail,
  SellerAddress,
  Location,
  OrderLog,
  OrderAddress,
  OrderDiscount,
  Ticket,
  TrackingHistory,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.tax = tax;
    this.order = Order;
    this.op = Sequelize.Op;
    this.request = request;
    this.location = Location;
    this.orderLog = OrderLog;
    this.discount = OrderDiscount;
    this.orderDetail = OrderDetail;
    this.orderAddress = OrderAddress;
    this.sellerAddress = SellerAddress;
    this.converter = snakeCaseConverter;
    this.ticket = Ticket;
    this.trackingHistory = TrackingHistory;
    return this.process();
  }

  async process() {
    const { params } = this.request;
    const seller = await jwtSelector({ request: this.request });
    console.log(seller);
    return new Promise((resolve, reject) => {
      try {
        this.orderDetail.findOne({
          attributes: [
            'orderId',
            'totalItem',
            'weight',
            'volume',
            'notes',
            'goodsContent',
            'goodsPrice',
            'codFee',
            'shippingCharge',
            'useInsurance',
            'insuranceAmount',
            'isCompleted',
            'sellerReceivedAmount',
            'codFeeAdmin',
            'codFeeAdminType',
          ],
          include: [
            {
              model: this.order,
              as: 'order',
              required: true,
              attributes: [
                'resi',
                'orderDate',
                'orderTime',
                'expedition',
                'serviceCode',
                'isCod',
                'status',
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
              model: this.ticket,
              as: 'ticket',
              required: false,
              attributes: [
                'id',
                'title',
                'message',
                'category',
                'priority',
                'status',
                'created_at',
                'updated_at',
              ],
            },
            {
              model: this.discount,
              as: 'discount',
              required: true,
              attributes: [
                'value',
              ],
            },
            {
              model: this.sellerAddress,
              as: 'sellerAddress',
              required: false,
              paranoid: false,
              attributes: [
                ['id', 'seller_address_id'],
                'address',
                'picName',
                'picPhoneNumber',
                'hideInResi',
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
          where: {
            sellerId: seller.id,
            orderId: params.id,
          },
        }).then(async (response) => {
          const result = await this.converter.objectToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );
          // console.log(result)
          if (response != null) {
            // console.log('response is not null')

            const orderLogs = await this.orderLog.findAll({
              attributes: [
                'previous_status',
                'current_status',
                'pod_status', 'note',
                // [Sequelize.fn('MIN', Sequelize.col('created_at')),'created_at'],
                // 'updated_at', 'deleted_at', 'order_id',
                // [Sequelize.fn('MIN', Sequelize.col('id')),'id'],
              ],
              // group: ['previous_status', 'current_status'],
              where: { orderId: result.order_id },
            });
            console.log(orderLogs);
            result.order = await this.converter.objectToSnakeCase(result?.order) || null;
            result.cod_value = result?.cod_fee || 0;

            result.seller_address = await this.converter.objectToSnakeCase(
              result?.seller_address,
            ) || null;

            result.order.receiver_address = await this.converter.objectToSnakeCase(
              result?.order?.receiver_address,
            ) || null;

            result.order.receiver_address.location = await this.converter.objectToSnakeCase(
              result?.order?.receiver_address?.location,
            ) || null;

            result.seller_address.location = await this.converter.objectToSnakeCase(
              result?.seller_address?.location,
            ) || null;

            result.order_log = await this.converter.arrayToSnakeCase(
              JSON.parse(JSON.stringify(orderLogs)),
            );

            let vatCalculated = this.tax.vat;

            if (this.tax.vatType === 'PERCENTAGE') {
              vatCalculated = (
                parseFloat(result.shipping_charge) * parseFloat(this.tax.vat)
              ) / 100;
            }

            const codFeeAdmin = result.cod_fee_admin;
            const insureanceAmount = result.insurance_amount;
            let shippingCalculated = result.shipping_charge;
            const shippingWithDiscount = result.shipping_charge - result?.discount?.value;

            if (result?.order?.is_cod) {
              shippingCalculated = parseFloat(shippingWithDiscount)
                + parseFloat(codFeeAdmin)
                + parseFloat(insureanceAmount);
            } else {
              shippingCalculated = parseFloat(shippingWithDiscount)
                + parseFloat(vatCalculated)
                + parseFloat(insureanceAmount);
            }

            result.shipping_charge = parseFloat(shippingCalculated);
          } else {
            console.log('RESPONSE IS ELSE');
          }

          if (response) resolve(result);
          else reject(httpErrors(404, 'No Data Found', { data: null }));
        });
      } catch (error) {
        console.log('this is error for detail response');
        reject(error);
      }
    });
  }
};
