const { Sequelize } = require('sequelize');
const tax = require('../constant/tax');
const {
  Discount,
  Insurance,
  TransactionFee,
} = require('../app/models');

const profitHandler = (payload) => new Promise(async (resolve, reject) => {
  try {
    let result = 0;
    let shippingFromApp = 0;
    let codValueWithFee = 0;
    let shippingCalculated = 0;
    let calculatedInsurance = 0;
    let selectedDiscount = null;

    const { vat } = tax;
    const trxFee = await TransactionFee.findOne();
    const sellerDiscount = payload.seller.sellerDetail.discount;
    const sellerDiscountType = payload.seller.sellerDetail.discountType;
    const insurance = await Insurance.findOne({ where: { expedition: payload.type } });
    const globalDiscount = await Discount.findOne({
      where: {
        [Sequelize.Op.or]: {
          minimumOrder: {
            [Sequelize.Op.gte]: 0,
          },
          maximumOrder: {
            [Sequelize.Op.lte]: payload.order_items.length,
          },
        },
      },
    });

    if (sellerDiscount && sellerDiscount !== 0) {
      selectedDiscount = {
        value: sellerDiscount || 0,
        type: sellerDiscountType || '',
      };
    }

    if (globalDiscount) {
      selectedDiscount = {
        value: globalDiscount?.value || 0,
        type: globalDiscount.type || '',
      };
    }

    const vatCalculated = (parseFloat(payload?.shippingCharge) * parseFloat(vat)) / 100;

    if (selectedDiscount.type === 'PERCENTAGE') {
      const discountCalculated = (
        parseFloat(payload?.shippingCharge) * parseFloat(selectedDiscount.value)
      ) / 100;

      shippingCalculated = parseFloat(payload?.shippingCharge) - parseFloat(discountCalculated);
    } else {
      shippingCalculated = parseFloat(payload?.shippingCharge) - parseFloat(selectedDiscount.value);
    }

    if (payload.is_cod) {
      if (payload.is_insurance && insurance && insurance.insuranceValue !== 0) {
        if (insurance.type === 'PERCENTAGE') {
          calculatedInsurance = (
            parseFloat(insurance.insuranceValue) * parseFloat(payload?.cod_value)
          ) / 100;
        } else {
          calculatedInsurance = parseFloat(insurance.insuranceValue);
        }
      }

      if (trxFee && trxFee.codFee !== 0) {
        if (trxFee.codFeeType === 'PERCENTAGE') {
          const feeCalculated = (
            parseFloat(payload?.shippingCharge) * parseFloat(trxFee.codFee)
          ) / 100;

          codValueWithFee = parseFloat(feeCalculated) + parseFloat(vatCalculated);
        } else {
          codValueWithFee = parseFloat(trxFee.codFee) + parseFloat(vatCalculated);
        }
      }

      shippingFromApp = (
        parseFloat(shippingCalculated)
        + parseFloat(codValueWithFee)
        + parseFloat(calculatedInsurance)
      );

      result = parseFloat(payload?.cod_value) - parseFloat(shippingFromApp);
    } else {
      if (payload.is_insurance && insurance && insurance.value !== 0) {
        if (insurance.type === 'PERCENTAGE') {
          calculatedInsurance = (
            parseFloat(insurance.value) * parseFloat(payload?.goods_amount)
          ) / 100;
        } else {
          calculatedInsurance = parseFloat(insurance.value);
        }
      }

      shippingFromApp = (
        parseFloat(shippingCalculated)
        + parseFloat(vatCalculated)
        + parseFloat(calculatedInsurance)
      );

      result = parseFloat(payload?.goods_amount) - parseFloat(shippingFromApp);
    }

    resolve(parseFloat(result));
  } catch (error) {
    reject(error);
  }
});

module.exports = profitHandler;
