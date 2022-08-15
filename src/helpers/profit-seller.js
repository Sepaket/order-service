const { Sequelize } = require('sequelize');
const tax = require('../constant/tax');
const {
  Discount,
  Insurance,
  SellerDetail,
  TransactionFee,
} = require('../app/models');

const profitHandler = (payload) => new Promise(async (resolve, reject) => {
  try {
    const totalProfit = [];
    let shippingFromApp = 0;
    let codValueWithFee = 0;
    let shippingCalculated = 0;
    let calculatedInsurance = 0;
    let selectedDiscount = null;

    const { vat } = tax;
    const seller = await SellerDetail.findOne({
      where: { sellerId: payload.sellerId },
    });

    const trxFee = await TransactionFee.findOne();
    const sellerDiscount = seller.discount;
    const sellerDiscountType = seller.discountType;
    const insurance = await Insurance.findOne({ where: { expedition: payload.items[0].type } });
    const globalDiscount = await Discount.findOne({
      where: {
        [Sequelize.Op.or]: {
          minimumOrder: {
            [Sequelize.Op.gte]: 0,
          },
          maximumOrder: {
            [Sequelize.Op.lte]: payload.items.length,
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

    payload.items.forEach((item) => {
      const vatCalculated = (parseFloat(item?.shippingCharge) * parseFloat(vat)) / 100;

      if (selectedDiscount.type === 'PERCENTAGE') {
        const discountCalculated = (
          parseFloat(item?.shippingCharge) * parseFloat(selectedDiscount.value)
        ) / 100;

        shippingCalculated = parseFloat(item?.shippingCharge) - parseFloat(discountCalculated);
      } else {
        shippingCalculated = parseFloat(item?.shippingCharge) - parseFloat(selectedDiscount.value);
      }

      if (item.is_cod) {
        if (item.is_insurance && insurance && insurance.insuranceValue !== 0) {
          if (insurance.type === 'PERCENTAGE') {
            calculatedInsurance = (
              parseFloat(insurance.insuranceValue) * parseFloat(item?.cod_value)
            ) / 100;
          } else {
            calculatedInsurance = parseFloat(insurance.insuranceValue);
          }
        }

        if (trxFee && trxFee.codFee !== 0) {
          if (trxFee.codFeeType === 'PERCENTAGE') {
            const feeCalculated = (
              parseFloat(item?.shippingCharge) * parseFloat(trxFee.codFee)
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

        totalProfit.push(parseFloat(item?.cod_value) - parseFloat(shippingFromApp));
      } else {
        if (item.is_insurance && insurance && insurance.value !== 0) {
          if (insurance.type === 'PERCENTAGE') {
            calculatedInsurance = (
              parseFloat(insurance.value) * parseFloat(item?.goods_amount)
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

        totalProfit.push(parseFloat(item?.goods_amount) - parseFloat(shippingFromApp));
      }
    });

    resolve(totalProfit);
  } catch (error) {
    reject(error);
  }
});

module.exports = profitHandler;
