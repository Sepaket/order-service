const moment = require('moment');
const shortid = require('shortid-36');
const { Sequelize } = require('sequelize');
const lalamove = require('../../../../helpers/lalamove');
const tax = require('../../../../constant/tax');
const lalamoveParameter = require('./order-parameter/lalamove');
const jwtSelector = require('../../../../helpers/jwt-selector');
const orderValidator = require('../../../../helpers/order-validator');
const { formatCurrency } = require('../../../../helpers/currency-converter');
const {
  batchCreator,
  resiMapper,
  shippingFee,
  orderLogger,
  orderSuccessLogger,
  orderFailedLogger,
} = require('../../../../helpers/order-helper');
const {
  Order,
  Seller,
  Location,
  Discount,
  Insurance,
  sequelize,
  OrderBatch,
  SellerDetail,
  SellerAddress,
  TransactionFee,
  ResiTracker,
} = require('../../../models');
const { stringify } = require('querystring');

module.exports = class {
  constructor({ request }) {
    this.lalamove = lalamove;
    this.tax = tax;
    this.order = Order;
    this.seller = Seller;
    this.op = Sequelize.Op;
    this.request = request;
    this.batch = OrderBatch;
    this.location = Location;
    this.discount = Discount;
    this.fee = TransactionFee;
    this.insurance = Insurance;
    this.address = SellerAddress;
    this.sellerDetail = SellerDetail;
    this.resiTracker = ResiTracker;

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
    console.log('geoloc-order-response.js - createOrder')
    const dbTransaction = await sequelize.transaction();
    try {
      const error = [];
      const result = [];
      const querySuccess = [];
      const queryrLogger = [];
      const { body } = this.request;
      var servCode = '';

      const batchConditon = (body?.batch_id && body?.batch_id !== '' && body?.batch_id !== null);
      const locationIds = body.order_items.map((item) => item.receiver_location_id);
      const sellerId = await jwtSelector({ request: this.request });
      const trxFee = await this.fee.findOne();

      let selectedDiscount = null;
      let batch = await this.batch.findOne({
        where: { id: body?.batch_id || 0, sellerId: sellerId.id },
      });

      const insurance = await this.insurance.findOne({
        where: { expedition: body.type },
      });

      const seller = await this.seller.findOne({
        where: { id: sellerId.id },
        include: [
          { model: this.sellerDetail, as: 'sellerDetail',
            include: [
              {
                model: this.seller,
                as: 'referred',
                required: false,
                include: [
                  {
                    model: this.sellerDetail,
                    as: 'referredDetail',
                    required: false,

                  },
                ],

              },
            ],
          },
        ],
      });

      const sellerLocation = await this.address.findOne({
        where: { id: body.seller_location_id, sellerId: sellerId.id },
        include: [{ model: this.location, as: 'location' }],
      });

      const destinationLocation = await this.location.findAll({
        where: { id: locationIds },
      });

      let referralRate = null;
      let referralRateType = null;
      let referredSellerId = null;
      if(seller.sellerDetail.referred !== null) {
        referralRate = seller.sellerDetail.referred.referredDetail.rateReferal
        referralRateType = seller.sellerDetail.referred.referredDetail.rateReferalType
        referredSellerId = seller.sellerDetail.referred.id
      } else {
        // console.log('NO REFERRAL')

      }

      const sellerDiscount = seller.sellerDetail.discount;
      const sellerDiscountType = seller.sellerDetail.discountType;
      const sellerCodFee = seller.sellerDetail.codFee;
      const sellerCodFeeType = seller.sellerDetail.codFeeType;

      const globalDiscount = await this.discount.findOne({
        where: {
          [this.op.or]: {
            minimumOrder: {
              [this.op.gte]: 0,
            },
            maximumOrder: {
              [this.op.lte]: body.order_items.length,
            },
          },
        },
      });

      if (globalDiscount) {
        selectedDiscount = {
          value: globalDiscount?.value || 0,
          type: globalDiscount?.type || '',
        };
      }

      if (sellerDiscount && sellerDiscount !== 0) {
        selectedDiscount = {
          value: sellerDiscount || 0,
          type: sellerDiscountType || '',
        };
      }

      let calculatedCredit = parseFloat(seller.sellerDetail.credit);

      if (!batchConditon) {
        batch = await batchCreator({
          dbTransaction,
          sellerId: sellerId.id,
          expedition: body.type,
          batchCode: `B${body?.order_items?.length}${shortid.generate()}`,
          totalOrder: body?.order_items?.length || 0,
        });
      }
      let lastresi = await ResiTracker.findOne({
        where: { logisticsProvider: 'sicepat' },
      });


      const currentResi = order?.resi?.includes(process.env.SICEPAT_CUSTOMER_ID)
        ? order?.resi?.split(process.env.SICEPAT_CUSTOMER_ID)?.pop() || '0000'
        : '0000';

      var sicepatResi = currentResi === '9999' ? parseInt('0000', 10) : parseInt(currentResi, 10);
      var nextId = 0;
      const latestOrder = await this.order.findOne({
        order: [['id', 'DESC']],
      });

      let increment = 1;
      const response = await Promise.all(
        body.order_items.map(async (item, index) => {
          var codCondition = (item.is_cod) ? (this.codValidator()) : true;
            servCode = body.service_code;

          let parameter = null;
          const origin = sellerLocation?.location;
          const destination = destinationLocation?.find((location) => {
            // const locationId = locationIds.find((id) => id === location.id);
            const locationId = item.receiver_location_id;

            return location.id === locationId;
          });

          let shippingCharge = await shippingFee({
            origin,
            destination,
            weight: item.weight,
            expedition: body.type,
            serviceCode: servCode,
          });

          let codValueCalculated = 0;
          let vatCalculated = this.tax.vat;
          let codFeeCalculated = trxFee?.codFee || 0;
          let discountAmount = selectedDiscount?.value || 0;
          let insuranceSelected = item.is_insurance
            ? insurance?.insuranceValue || 0 : 0;

          let shippingWithDiscount = parseFloat(shippingCharge)
            + parseFloat(selectedDiscount?.value || 0);

          if (sellerCodFee && sellerCodFee >= 0) {
            if (sellerCodFeeType === 'PERCENTAGE' && item.is_cod) {
              codFeeCalculated = (
                parseFloat(item.cod_value) * parseFloat(sellerCodFee || 0)
              ) / 100;
            }
          } else {
            if (trxFee?.codFeeType === 'PERCENTAGE' && item.is_cod) {
              codFeeCalculated = (
                parseFloat(item.cod_value) * parseFloat(trxFee?.codFee || 0)
              ) / 100;
            }
          }
          if (this.tax.vatType === 'PERCENTAGE') {
            vatCalculated = (
              parseFloat(shippingCharge) * parseFloat(this.tax.vat)
            ) / 100;
          }

          if (item.is_cod) {
            codValueCalculated = codFeeCalculated + vatCalculated;
          }

          if (selectedDiscount?.type === 'PERCENTAGE') {
            discountAmount = (
              parseFloat(shippingCharge) * parseFloat(selectedDiscount.value)
            ) / 100;

            shippingWithDiscount = parseFloat(shippingCharge) - discountAmount;
          }

          if (item.is_insurance) {
            if (insurance?.insuranceValueType === 'PERCENTAGE') {
              if (item.is_cod) {
                const goodsAmountInsurance = (
                  parseFloat(item.cod_value) - parseFloat(shippingCharge)
                );

                if (parseFloat(item.cod_value) <= parseFloat(shippingCharge)) {
                  insuranceSelected = (
                    parseFloat(insurance?.insuranceValue) * parseFloat(item.goods_amount)
                  ) / 100;
                } else {
                  insuranceSelected = (
                    parseFloat(insurance?.insuranceValue) * parseFloat(goodsAmountInsurance)
                  ) / 100;
                }

              } else {
                insuranceSelected = (
                  parseFloat(insurance?.insuranceValue) * parseFloat(item.goods_amount)
                ) / 100;
              }
            }
          }

          let shippingCalculated = 0;
          if (item.is_cod) {
            shippingCalculated = parseFloat(shippingWithDiscount)
            + parseFloat(codValueCalculated)
            + parseFloat(insuranceSelected);
          } else {

            shippingCalculated = parseFloat(shippingWithDiscount)
            + parseFloat(vatCalculated)
            + parseFloat(insuranceSelected);
          }
          const codFee = (parseFloat(trxFee?.codFee || 0) * parseFloat(shippingCharge || 0)) / 100;
          const goodsAmount = !item.is_cod
            ? parseFloat(item.goods_amount)
            : parseFloat(item.cod_value) - (parseFloat(shippingCharge || 0) + parseFloat(codFee));

          const creditCondition = parseFloat(calculatedCredit) >= parseFloat(shippingCalculated);
          // console.log(creditCondition);
          if (!item.is_cod) calculatedCredit -= parseFloat(shippingCalculated);

          const totalAmount = item?.is_cod
            ? parseFloat(item?.cod_value)
            : (parseFloat(item?.goods_amount) + parseFloat(shippingCharge));

          const ongkirminuscod = item?.is_cod
            ? (parseFloat(item?.cod_value) - parseFloat(shippingCharge))
            : 0;

          if (body.type === 'LALAMOVE'){
            console.log('lalamove order')
            const tes_lalamove = '{"data":{"serviceType":"MOTORCYCLE","specialRequests":["TOLL_FEE_10"],"language":"en_HK","stops":[{"coordinates":{"lat":"22.33547351186244","lng":"114.17615807116502"},"address":"Innocentre, 72 Tat Chee Ave, Kowloon Tong"},{"coordinates":{"lat":"22.29553167157697","lng":"114.16885175766998"},"address":"Canton Rd, Tsim Sha Tsui"}],"isRouteOptimized":false,"item":{"quantity":"12","weight":"LESS_THAN_3_KG","categories":["FOOD_DELIVERY","OFFICE_ITEM"],"handlingInstructions":["KEEP_UPRIGHT"]}}}';
            // console.log(tes_lalamove);
            var resi = await resiMapper({ expedition: body.type, currentResi: sicepatResi, id: index,batchId: batch.id });
          }

          const resiIsExist = await this.order.findOne({
            where: { resi, expedition: body.type },
          });

          if (resiIsExist) {
            if (body.type === 'LALAMOVE') {
              nextId = nextId + 1;
              resi = await resiMapper({ expedition: body.type, currentResi: nextId,id: index,batchId: batch.id });
            }
          }

          // shippingCharge = 1; //RENO INI MESTI DIGANTI. INI HANYA BUAT TESTING SAP SEBELUM SHIPPING CALCULATION DI FIX

          const payload = {
            codFeeAdmin: codValueCalculated,
            discuontSelected: discountAmount,
            shippingCalculated,
            insuranceSelected,
            creditCondition,
            sellerLocation,
            shippingCharge,
            codCondition,
            goodsAmount,
            destination,
            origin,
            seller,
            resi,
            referralRate,
            referralRateType,
            referredSellerId,
            ongkirminuscod,
            ...item,
            ...body,
          };
          const orderCode = `${shortid.generate()}${moment().format('mmss')}`;
          const messages = await orderValidator(payload);

          if (body.type === 'LALAMOVE') parameter = await lalamoveParameter({ payload });
          if (messages?.length > 0) error.push({ order: item, errors: messages });
          if (messages?.length < 1) {
            // const tes_payload =               {...parameter,
            //   resi,
            //   type: body.type};
            // console.log(tes_payload);
            querySuccess.push({
              ...parameter,
              resi,
              type: body.type,
            });
            queryrLogger.push({
              ...payload,
              orderCode,
              batchId: batch.id,
            });
            const resultResponse = await this.responseMapper({
              ...payload,
              totalAmount,
              insurance,
              orderCode,
            });
            result.push(resultResponse);
          } else {
            console.log('order validator error')
            console.log(messages)
          }

          return error?.shift();
          // return error;
        }),
      );


      if (querySuccess?.length > 0) {
        await orderSuccessLogger(querySuccess);

        await orderLogger({
          items: queryrLogger,
          sellerId: seller.id,
        });


      }


      const filtered = response?.filter((item) => item);
      const orderResponse = {
        info: {
          success: body.order_items.length - filtered.length,
          failed: filtered.length,
        },
        order: {
          pickup_info: {
            expedition: body.type,
            service_code: servCode,
            should_pickup_with: body.should_pickup_with,
            pickup_date: body.pickup_date,
            pickup_time: body.pickup_time,
            seller_location_id: body.seller_location_id,
          },
        },
        logs: {
          success_log: result,
          failed_log: filtered,
        },
      };

      if (filtered?.length > 0 && !batchConditon) {
        await this.batch.update(
          {
            totalOrderSent: 0,
            totalOrderProblem: filtered.length,
            totalOrderProcessed: body.order_items?.length - filtered?.length,
          },
          { where: { id: batch.id } },
        );
        await orderFailedLogger({
          ...orderResponse,
          batchId: batch.id,
        });
      }

      if (batchConditon) {
        const total = body.order_items?.length - filtered?.length;
        await this.batch.update(
          {
            totalOrderSent: batch.totalOrderSent,
            totalOrderProblem: filtered?.length,
            totalOrderProcessed: parseInt(batch.totalOrderProcessed, 10) + parseInt(total, 10),
          },
          { where: { id: batch.id } },
        );
      }
      return orderResponse;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }
  codValidator() {
    // console.log("masuk codValidator - reno");
    let result;
    const { body } = this.request;
    if (body.type === 'JNE') result = (body.service_code === 'JNECOD');
    return result;
  }



  // eslint-disable-next-line class-methods-use-this
  responseMapper(payload) {
    const truncatedAddress = (payload?.receiver_address).substring(0,200) || null;
    const truncatedAddressNote = (payload?.receiver_address_note).substring(0,100) || null;
    const truncatedGoodsContent = (payload?.goods_content).substring(0,50) || null;
    const truncatedGoodsNotes = (payload?.notes).substring(0,100) || null;
    var servCode = payload?.service_code || null;
    if (payload.service_code === "JNECOD") {
      servCode = "REG23";
    } else if (payload.service_code === "NINJACOD") {
      servCode = "Standard";
    }
    return {
      resi: payload?.resi,
      order: {
        order_code: payload?.orderCode,
        service: payload?.type,
        service_code: servCode,
        weight: payload?.weight,
        goods_content: truncatedGoodsContent,
        goods_qty: payload?.goods_qty,
        goods_notes: truncatedGoodsNotes,
        insurance_amount: payload?.is_insurance ? payload?.insuranceSelected || 0 : 0,
        is_cod: payload?.is_cod,
        total_amount: {
          raw: payload?.totalAmount,
          formatted: formatCurrency(payload?.totalAmount, 'Rp.'),
        },
      },
      receiver: {
        name: payload?.receiver_name,
        phone: payload?.receiver_phone,
        address: truncatedAddress,
        address_note: truncatedAddressNote,
        location: payload?.destination || null,
        postal_code: payload?.postal_code,
        sub_district: payload?.sub_district,
      },
      sender: {
        name: payload?.sellerLocation?.name || '',
        pic_name: payload?.sellerLocation?.picName || '',
        phone: payload?.sellerLocation?.picPhoneNumber || '',
        hide_address: payload?.sellerLocation?.hideInResi || false,
        address: payload?.sellerLocation?.address || '',
        address_note: '',
        location: payload?.origin || null,
      },
    };
  }
};
