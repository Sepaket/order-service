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
const httpErrors = require('http-errors');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

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
      if (item.order.isCod && (item.order.status === 'RETURN_TO_SELLER')) {
        ongkirReturned = -1 * parseFloat(item.shipping_calculated);
      }
      if ((item.order.isCod)) {
        ongkirReturned = parseFloat(item.cod_fee) - parseFloat(item.shipping_calculated);
        // console.log(parseFloat(item.cod_fee));
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
        // this.order.findAll({
        //   where: {
        //     '$detail.seller_id$': seller.id,
        //     status: 'DELIVERED',
        //     isCod: true,
        //     ...this.querySearch(),
        //   },
        //   include: [{
        //     model: OrderDetail,
        //     as: 'detail',
        //   }],
        }).then((response) => {
          console.log(response.count);
          // console.log(response.rows);
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response.rows)),
          );

          const mapped = result?.map((item) => ({
            ...item,
            order: this.converter.objectToSnakeCase(item?.order) || null,
            receiver_address: this.converter.objectToSnakeCase(item?.receiver_address) || null,
            seller_received_amount: getSellerReceivedAmount(item),
            seller_address: {
              ...item.seller_address,
              location: this.converter.objectToSnakeCase(item?.seller_address?.location) || null,
            },
          }));

          if (mapped.length > 0) {
            resolve( response.count);
          } else {
            reject(httpErrors(404, 'No Data Found', {
              code: 404,
              data: response.count,
              message: "No Data Found",
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
        createdAt: {
          [this.op.between]: [
            moment(query.start_date).startOf('day').format(),
            moment(query.end_date).endOf('day').format(),
          ],
        },
      };
    }

    if (query.filter_by === 'MONTH') {
      filtered = {
        createdAt: {
          [this.op.between]: [
            moment(query.start_date).startOf('month').format(),
            moment(query.end_date).endOf('month').format(),
          ],
        },
      };
    }

    if (query.filter_by === 'YEAR') {
      filtered = {
        createdAt: {
          [this.op.between]: [
            moment(query.start_date).startOf('year').format(),
            moment(query.end_date).endOf('year').format(),
          ],
        },
      };
    }

    const condition = {
      [this.op.and]: {
        ...filtered,
      },
      is_cod: true,
      status: {
        [this.op.in]: [
          'DELIVERED'
        ],
      }
    };

    return query?.filter_by ? condition : {};
  }

};
