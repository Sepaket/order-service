const { Sequelize } = require('sequelize');
const excelReader = require('read-excel-file/node');
const jne = require('../../../../helpers/jne');
const ninja = require('../../../../helpers/ninja');
const sicepat = require('../../../../helpers/sicepat');
const jwtSelector = require('../../../../helpers/jwt-selector');
const { formatCurrency } = require('../../../../helpers/currency-converter');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const {
  Location,
  Seller,
  Order,
  OrderLog,
  OrderDetail,
  OrderAddress,
  SellerAddress,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.sicepat = sicepat;
    this.ninja = ninja;
    this.jne = jne;
    this.order = Order;
    this.seller = Seller;
    this.op = Sequelize.Op;
    this.request = request;
    this.location = Location;
    this.orderLog = OrderLog;
    this.address = SellerAddress;
    this.orderDetail = OrderDetail;
    this.orderAddress = OrderAddress;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.createOrder();

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  async createOrder() {
    try {
      const { body } = this.request;
      const sellerId = await jwtSelector({ request: this.request });

      this.sellerAddress = await this.address.findOne({
        where: { id: body.seller_location_id, sellerId: sellerId.id },
        include: [
          {
            model: this.location,
            as: 'location',
            required: true,
          },
        ],
      });

      const fileName = body.file.split('/public/');
      if (!fileName[1]) throw new Error('File not found!');

      const result = [];
      const dataOrders = await excelReader(`public/${fileName[1]}`);
      var errorFlag = false;
      var errorMsgArray = [];
      var failCount = 0;
      var successCount = 0;
      await Promise.all(
        dataOrders?.map(async (item, index) => {

          if (index !== 0) {
            const excelData = {
              receiverName: item[0],
              receiverPhone: item[1],
              receiverAddress: item[2],
              receiverAddressNote: item[3],
              receiverAddressDistrict: item[4],
              receiverAddressSubDistrict: item[5],
              receiverAddressPostalCode: item[6],
              weight: item[7],
              volume: item[8],
              goodsAmount: item[9],
              codValue: item[10],
              goodsContent: item[11],
              goodsQty: item[12],
              isInsurance: item[13],
              note: item[14],
              isCod: !!((item[10] && item[10] !== '' && item[10] !== 0) || item[10] !== null),
            };

            const locations = await this.location.findAll({
              where: {
                [this.op.or]: {
                  // subDistrict: {
                  //   [this.op.substring]: excelData?.receiverAddressSubDistrict?.toLowerCase(),
                  // },
                  district: {
                    [this.op.substring]: excelData?.receiverAddressDistrict?.toLowerCase(),
                  },
                  postalCode: {
                    [this.op.eq]: `${excelData?.receiverAddressPostalCode}`,
                  },
                },
              },
            });

            const origin = this.sellerAddress?.location || null;
            const price = excelData?.isCod ? excelData?.codValue : excelData?.goodsAmount;
            const destination = locations?.find((location) => location.postalCode === `${excelData.receiverAddressPostalCode}`); //destination menggunakan postal code *reno
            // console.log(destination)
            const shippingFee = await this.shippingFee({
              origin,
              destination,
              weight: excelData.weight,
            });
            const receiverAddress = excelData.receiverAddress;

            const minLength = 10;
            const maxLength = 80;
            var errorMessage = '';
            errorFlag = false;
            errorMsgArray = [];
            var errorLongString = '';

            if (excelData.isCod) {
              if (body.type === 'JNE' && body.service_code !== 'JNECOD') {
                errorMessage = 'cannot use ' + body.service_code + ' for COD';
                console.log(errorMessage);
                errorMsgArray.push({message : errorMessage});
                errorFlag = true;
              } else if (body.type === 'NINJA' && body.service_code !== 'NINJACOD') {
                errorMessage = 'cannot use ' + body.service_code + ' for COD';
                console.log(errorMessage);
                errorMsgArray.push({message : errorMessage});
                errorFlag = true;
              }
            }

            // if (receiverAddress.length < minLength) {
            //   errorMessage = 'Address is too short - bulk order response';
            //   console.log(errorMessage);
            //   errorMsgArray.push({message : errorMessage});
            //   errorFlag = true;
            // } else if (receiverAddress.length > maxLength) {
            //   errorMessage = 'Address is too long';
            //   console.log(errorMessage);
            //   errorMsgArray.push({message : errorMessage});
            //   errorFlag = true;
            // }
            //

            if (errorFlag) {
              failCount++;
            } else {
              successCount++;
            }
            result.push({
              errors: errorMsgArray,
              receiver_name: excelData?.receiverName || '',
              receiver_phone: excelData?.receiverPhone || '',
              receiver_location: {
                id: destination?.id || 0,
                province: destination?.province || '',
                city: destination?.city || '',
                district: destination?.district || '',
                sub_district: destination?.subDistrict || '',
                postal_code: destination?.postalCode || '',
              },
              postal_code: excelData?.receiverAddressPostalCode,
              sub_district: excelData?.receiverAddressSubDistrict,
              receiver_address: excelData?.receiverAddress || '',
              receiver_address_note: excelData?.receiverAddressNote || '',
              is_cod: excelData?.isCod || false,
              weight: excelData?.weight || 1,
              cod_value: excelData?.codValue || 0,
              goods_amount: price || 0,
              goods_content: excelData?.goodsContent || '',
              goods_qty: excelData?.goodsQty || 1,
              note: excelData?.note || '',
              is_insurance: excelData?.isInsurance || false,
              shipping_fee: {
                raw: shippingFee || 0,
                formatted: formatCurrency(shippingFee || 0, 'Rp.'),
              },
            });
          }

          return item;
        }) || [],
      ).finally(() => {
        console.log('success - fail : ' + successCount + ' : ' + failCount);
      });
      return [result, successCount, failCount];
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async shippingFee({ origin, weight, destination }) {
    try {
      let shippingFee = 0;
      const { body } = this.request;

      if (body.type === 'SICEPAT') {
        const prices = await this.sicepat.checkPrice({
          origin: origin?.sicepatOriginCode,
          destination: destination?.sicepatDestinationCode,
          weight,
        });

        const service = await prices?.find((item) => item.service === body.service_code);

        shippingFee = service?.tariff || 0;
      }

      if (body.type === 'JNE') {
        const prices = await this.jne.checkPrice({
          origin: origin?.jneOriginCode || '',
          destination: destination?.jneDestinationCode || '',
          weight,
        });
        console.log('JNE');
        console.log(body.service_code);

        const service = await prices?.find((item) => item.service_code === body.service_code);
        let servCode = '';
        // if (body.service_code === 'CTCYES19') {
        //   servCode = 'YES19';
        // }
        // if (body.service_code === 'CTCYES') {
        //   servCode = 'YES';
        // }
        //
        // if (body.service_code === 'CTCSPS19') {
        //   servCode = 'SPS19';
        // }
        // if (body.service_code === 'CTC19') {
        //   servCode = 'REG19';
        // }
        // if (body.service_code === 'JNECOD') {
        //   servCode = 'REG19';
        // }

        shippingFee = service?.price || 0;
      }

      if (body.type === 'NINJA') {
        const price = await this.ninja.checkPrice({
          origin: origin?.ninjaOriginCode,
          destination: destination?.ninjaDestinationCode,
          service: body.service_code,
          weight,
        });

        shippingFee = price || 0;
      }

      return shippingFee;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }
};
