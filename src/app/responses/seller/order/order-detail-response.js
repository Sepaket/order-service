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
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.tax = tax;
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
    const { params } = this.request;
    const seller = await jwtSelector({ request: this.request });

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
                'hideInResi',
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
            {
              model: this.orderAddress,
              as: 'receiverAddress',
              required: false,
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

          const orderLogs = await this.orderLog.findAll({
            order: [['id', 'ASC']],
            where: { orderId: result.order_id },
          });

          result.order = await this.converter.objectToSnakeCase(result?.order) || null;
          result.cod_value = result?.cod_fee || 0;

          result.seller_address = await this.converter.objectToSnakeCase(
            result?.seller_address,
          ) || null;

          result.receiver_address = await this.converter.objectToSnakeCase(
            result?.receiver_address,
          ) || null;

          result.receiver_address.location = await this.converter.objectToSnakeCase(
            result?.receiver_address?.location,
          ) || null;

          result.seller_address.location = await this.converter.objectToSnakeCase(
            result?.seller_address?.location,
          ) || null;

          result.order_log = await this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(orderLogs)),
          );

          if (response) resolve(result);
          else reject(httpErrors(404, 'No Data Found', { data: null }));
        });
      } catch (error) {
        reject(error);
      }
    });
  }
};
