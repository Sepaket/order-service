const tax = require('../../../../constant/tax');
const jwtSelector = require('../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const {
  TransactionFee,
  Insurance,
  Discount,
  SellerDetail,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.fee = TransactionFee;
    this.insurance = Insurance;
    this.discount = Discount;
    this.seller = SellerDetail;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    try {
      const trxFee = await this.fee.findOne();
      const sellerId = await jwtSelector({ request: this.request });
      const seller = await this.seller.findOne({
        where: { sellerId: sellerId.id },
      });

      const insurances = await this.insurance.findAll({
        attributes: [
          ['id', 'insurance_id'],
          'expedition',
          'insurance_value',
          'insurance_value_type',
          'admin_fee',
          'admin_fee_type',
        ],
      });

      const discounts = await this.discount.findAll({
        attributes: [
          ['id', 'discount_id'],
          'value',
          'type',
          'maximumOrder',
          'minimumOrder',
        ],
      });
      let globalDisc = {};
      const discountMap = seller?.discount > 0
        ? [{
          specific_seller: true,
          type: seller.discountType,
          value: seller.discount,
          minimum_order: null,
          maximum_order: null,
        }] : discounts?.map((item) => ({
          specific_seller: false,
          type: item.type,
          value: item.value,
          minimum_order: item.minimumOrder,
          maximum_order: item.maximumOrder,
        }));

      if (seller?.discount > 0) {
        globalDisc.type = seller.discountType;
        globalDisc.value = seller.discount;
      } else {
        globalDisc.type = discounts[0].type;
        globalDisc.value = discounts[0].value;
      }
      const allowedServiceCodeDiscount = ['CTC23', 'REG23', 'Standard', 'REG', 'SIUNT', 'UDRREG', 'JNECOD', 'SICEPATCOD', 'NINJACOD', 'SAPCOD'];

      const servicecode3plmap =  {
        'CTC23' : 'JNE',
        'REG23' : 'JNE',
        'Standard' : 'NINJA',
        'REG' : 'SICEPAT',
        'SIUNT' : 'SICEPAT',
        'UDRREG' : 'SAP',
        'JNECOD' : 'JNE',
        'SICEPATCOD' : 'SICEPAT',
        'NINJACOD' : 'NINJA',
        'SAPCOD' : 'SAP',
      };

      let sel_disc = seller.discount;
      if (sellerId.id === 1298) {
        if (item3pl == 'Standard' || item3pl == 'NINJACOD') {
          sel_disc = 5;
        }

      }



      const res2 = allowedServiceCodeDiscount.map((item3pl) =>({
        specific_seller: true,
          expedition: servicecode3plmap[item3pl],
          serviceCode: item3pl,
          type: seller.discountType,
          value: sel_disc,
          minimum_order: null,
          maximum_order: null,

    }
        ))
      return {
        cod_fee: {
          value: trxFee?.codFee || 0,
          type: trxFee?.codFeeType || 'PERCENTAGE',
        },
        vat: {
          value: tax.vat,
          type: tax.vatType,
        },
        discount: discountMap || [],
        service_discount: res2 || [],
        insurance: insurances || [],
      };
    } catch (error) {
      throw new Error(error?.message);
    }
  }
};
