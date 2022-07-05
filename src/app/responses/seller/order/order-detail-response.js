const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
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
            'shippingCharge',
            'useInsurance',
            'insuranceAmount',
            'isCompleted',
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
        }).then((response) => {
          const result = this.converter.objectToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          result.order = this.converter.objectToSnakeCase(result?.order) || null;
          result.seller_address = this.converter.objectToSnakeCase(result?.seller_address) || null;

          result.receiver_address = this.converter.objectToSnakeCase(
            result?.receiver_address,
          ) || null;

          result.receiver_address.location = this.converter.objectToSnakeCase(
            result?.receiver_address?.location,
          ) || null;

          result.seller_address.location = this.converter.objectToSnakeCase(
            result?.seller_address?.location,
          ) || null;

          if (response) resolve(result);
          else reject(httpErrors(404, 'No Data Found', { data: null }));
        });
      } catch (error) {
        reject(error);
      }
    });
  }
};
