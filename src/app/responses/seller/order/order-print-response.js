const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { formatCurrency } = require('../../../../helpers/currency-converter');
const jwtSelector = require('../../../../helpers/jwt-selector');
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
    const seller = await jwtSelector({ request: this.request });

    return new Promise((resolve, reject) => {
      try {
        this.orderDetail.findAll({
          attributes: [
            'orderId',
            'batchId',
            'weight',
            'volume',
            'notes',
            'codFee',
            'goodsPrice',
            'totalItem',
            'goodsContent',
            'useInsurance',
            'insuranceAmount',
            'shippingCharge',
            'shippingCalculated',
          ],
          include: [
            {
              model: this.order,
              as: 'order',
              required: true,
              attributes: [
                'resi',
                'orderCode',
                'expedition',
                'serviceCode',
                'isCod',
              ],
              include: [
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
              ],
            },
            {
              model: this.sellerAddress,
              as: 'sellerAddress',
              required: false,
              attributes: [
                ['id', 'seller_address_id'],
                'address',
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
          where: { ...search, sellerId: seller.id },
          order: [['id', 'DESC']],
        }).then((response) => {
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          const mapped = result?.map((item) => {
            const totalAmount = item.order.isCod
              ? parseFloat(item?.cod_fee)
              : (parseFloat(item?.goods_price) + parseFloat(item?.shipping_charge));

            const truncatedAddress = (item?.order?.receiverAddress?.receiverAddress).substring(0,200) || null;
            const truncatedAddressNote = (item?.order?.receiverAddress?.receiverAddressNote).substring(0,100) || null;
            const truncatedGoodsContent = (item?.goods_content).substring(0,50) || null;
            const truncatedGoodsNotes = (item?.notes).substring(0,100) || null;


            return {
              resi: item.order.resi,
              order_id: item.order_id,
              order: {
                order_code: item.order.orderCode,
                order_id: item.order_id,
                service: item.order.expedition,
                service_code: item.order.serviceCode,
                weight: item.weight,
                goods_content: truncatedGoodsContent,
                goods_qty: item.total_item,
                goods_notes: truncatedGoodsNotes,
                use_insurance: item.use_insurance,
                insurance_amount: item.insurance_amount,
                is_cod: item.order.isCod,
                total_amount: {
                  raw: totalAmount,
                  formatted: formatCurrency(totalAmount, 'Rp.'),
                },
              },
              receiver: {

                name: item?.order?.receiverAddress?.receiverName || '',
                phone: item?.order?.receiverAddress?.receiverPhone || '',
                address: truncatedAddress || '',
                address_note: truncatedAddressNote || '',
                location: this.converter.arrayToSnakeCase(item?.order?.receiverAddress?.location) || null,

              },
              sender: {
                name: item?.order?.receiverAddress?.senderName || '',
                phone: item?.order?.receiverAddress?.senderPhone || '',
                hide_address: item.order?.receiverAddress?.hideInResi,
                address: item?.seller_address?.address || '',
                address_note: '',
                location: this.converter.arrayToSnakeCase(item?.seller_address?.location) || null,
              },
            };
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
      [this.op.or]: {
        batchId: {
          [this.op.in]: body.batch_ids,
        },
        orderId: {
          [this.op.in]: body.order_ids,
        },
      },
    };

    return condition;
  }
};
