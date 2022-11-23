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
              receiverAddressSubDistrict: item[4],
              receiverAddressPostalCode: item[5],
              weight: item[6],
              volume: item[7],
              goodsAmount: item[8],
              codValue: item[9],
              goodsContent: item[10],
              goodsQty: item[11],
              isInsurance: item[12],
              note: item[13],
              isCod: !!((item[9] && item[9] !== '' && item[9] !== 0) || item[9] !== null),
            };

            const locations = await this.location.findAll({
              where: {
                [this.op.or]: {
                  subDistrict: {
                    [this.op.substring]: excelData?.receiverAddressSubDistrict?.toLowerCase(),
                  },
                  district: {
                    [this.op.substring]: excelData?.receiverAddressSubDistrict?.toLowerCase(),
                  },
                  postalCode: {
                    [this.op.eq]: `${excelData?.receiverAddressPostalCode}`,
                  },
                },
              },
            });

            const origin = this.sellerAddress?.location || null;
            const price = excelData?.isCod ? excelData?.codValue : excelData?.goodsAmount;
            const destination = locations?.find((location) => location.postalCode === `${excelData.receiverAddressPostalCode}`);
            const shippingFee = await this.shippingFee({
              origin,
              destination,
              weight: excelData.weight,
            });
            const receiverAddress = excelData.receiverAddress;
            console.log(receiverAddress);
            const minLength = 10;
            const maxLength = 80;
            var errorMessage = '';
            errorFlag = false;
            errorMsgArray = [];
            var errorLongString = '';
            console.log('isCOD');
            console.log(excelData.isCod);
            if (excelData.isCod) {
              if (body.type === 'JNE' && body.service_code !== 'JNECOD') {
                errorMessage = 'cannot use ' + body.service_code + ' for COD';
                console.log(errorMessage);
                // errorLongString = errorLongString + '"' + errorMessage + '", ';
                // errorMsgArray.push({serviceCode : errorMessage});
                errorMsgArray.push({message : errorMessage});
                errorFlag = true;
              }
            }
            if (receiverAddress.length < minLength) {
              errorMessage = 'Address is too short';
              console.log(errorMessage);
              // errorLongString = errorLongString + '"' + errorMessage + '", ';
              errorMsgArray.push({message : errorMessage});
              console.log(receiverAddress.length);
              errorFlag = true;
            } else if (receiverAddress.length > maxLength) {
              errorMessage = 'Address is too long';
              // errorMsgArray.push(errorMessage);
              // errorLongString = errorLongString + '"' + errorMessage + '", ';
              console.log(errorMessage);
              errorMsgArray.push({message : errorMessage});
              console.log(receiverAddress.length);
              errorFlag = true;
            }
            if (errorFlag) {
              console.log(receiverAddress);
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
          // console.log(result);
          // console.log("============================================");
          // console.log(item);
          return item;
        }) || [],
      ).finally(() => {
        console.log('success - fail');
        console.log(successCount);
        console.log(failCount);
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

        const service = await prices?.find((item) => item.service_code === body.service_code);

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
