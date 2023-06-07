// const httpErrors = require('http-errors');
const jne = require('../../../../helpers/jne');
const tax = require('../../../../constant/tax');
const ninja = require('../../../../helpers/ninja');
const sicepat = require('../../../../helpers/sicepat');
const sap = require('../../../../helpers/sap');
const idexpress = require('../../../../helpers/idexpress');
const { idxServiceStatus } = require('../../../../constant/status');
const jwtSelector = require('../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { formatCurrency } = require('../../../../helpers/currency-converter');
const {
  Location,
  Discount,
  SellerDetail,
  TransactionFee,
} = require('../../../models');

module.exports = class {
  constructor({ request }) {
    this.jne = jne;
    this.tax = tax;
    this.ninja = ninja;
    this.sap = sap;
    this.request = request;
    this.sicepat = sicepat;
    this.location = Location;
    this.discount = Discount;
    this.fee = TransactionFee;
    this.seller = SellerDetail;
    this.idexpress = idexpress;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        let result = [];
        const { body } = this.request;
        this.selectedFee = await this.fee.findOne();
        this.selectedVat = { type: this.tax.vatType, value: this.tax.vat };
        this.origin = await this.location.findOne({ where: { id: body.origin } });
        this.destination = await this.location.findOne({ where: { id: body.destination } });
        this.selectedDiscount = await this.discountCalculate();
        const serviceFee = await this.checkServiceFee();

        if (serviceFee.length > 0) {
          result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(...serviceFee)),
          );
        }

        resolve({
          data: result,
          meta: null,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async checkServiceFee() {
    try {
      console.log('enter service fee');
      const { body } = this.request;
      const fees = [];

      const jneCondition = (
        this.origin.jneOriginCode !== '' && this.destination.jneDestinationCode !== ''
      );

      const sicepatCondition = (
        this.origin.sicepatOriginCode !== '' && this.destination.sicepatDestinationCode !== ''
      );

      const ninjaCondition = (
        this.origin.ninjaOriginCode !== '' && this.destination.ninjaDestinationCode !== ''
      );
      const sapCondition = (
        this.origin.sapOriginCode !== '' && this.destination.sapDestinationCode !== ''
      );

      const idxCondition = (
        this.origin.idexpressOriginCode !== '' && this.destination.idexpressDestinationCode !== ''
      );

      if (body.type === 'JNE' && jneCondition) {
        const jnePrices = await this.jneFee();
        // console.log(jnePrices);
        if (jnePrices?.length > 0) fees.push(jnePrices);
      }

      if (body.type === 'SICEPAT' && sicepatCondition) {
        const sicepatPrices = await this.sicepatFee();
        if (sicepatPrices?.length > 0) fees.push(sicepatPrices);
      }

      if (body.type === 'NINJA' && ninjaCondition) {
        console.log(`origin code 1: ${this.origin.ninjaOriginCode} origin code 2 : ${this.origin.ninjaDestinationCode}`);
        console.log(`destination code 1: ${this.destination.ninjaOriginCode}`);
        const ninjaPrices = await this.ninjaFee();
        if (ninjaPrices?.length > 0) fees.push(ninjaPrices);
      }

      if (body.type === 'SAP' && sapCondition) {
        // console.log(sapCondition);
        console.log('this is SAP')
        const sapPrice = await this.sapFee();
        console.log(' after sapPrice');
        if (sapPrice?.length > 0) fees.push(sapPrice);
      }

      if (body.type === 'IDEXPRESS' && idxCondition) {
        const idxPrice = await this.idxFee();
        if (idxPrice?.length > 0) fees.push(idxPrice);
      }

      if (body.type === 'ALL') {
        let result = [];
        let jnePrices = [];
        let sicepatPrices = [];
        let ninjaPrices = [];
        let sapPrices = [];
        let idxPrices = [];

        if (jneCondition) jnePrices = await this.jneFee();
        if (sicepatCondition) sicepatPrices = await this.sicepatFee();
        if (ninjaCondition) ninjaPrices = await this.ninjaFee();
        // if (sapCondition) sapPrices = await this.sapFee();
        if (idxCondition) idxPrices = await this.idxFee();

        result = result.concat(jnePrices);
        result = result.concat(sicepatPrices);
        result = result.concat(ninjaPrices);
        result = result.concat(idxPrices);

        fees.push(result);
      }

      return fees;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async discountCalculate() {
    try {
      let seller = null;
      const authorizationHeader = this.request.headers.authorization;
      if (authorizationHeader?.toLowerCase()?.startsWith('bearer ')) {
        const selectedId = await jwtSelector({ request: this.request });
        seller = await this.seller.findOne({ where: { id: selectedId?.id } });
      }

      const discount = await this.discount.findOne({ order: [['id', 'ASC']] });
      const selectedDiscount = seller?.discount > 0
        ? {
          value: seller?.discount || 0,
          type: seller?.discountType || '',
        } : {
          value: discount?.value || 0,
          type: discount?.type || '',
        };
      return selectedDiscount;
    } catch (error) {
      throw new Error(error?.message || 'Something Wromh');
    }
  }

  async jneFee() {
    try {
      const { body } = this.request;
      const prices = await this.jne.checkPrice({
        origin: this.origin.jneOriginCode,
        destination: this.destination.jneDestinationCode,
        weight: body.weight,
      });

      console.log(prices);

      const mapped = await prices?.filter((item) => item.times)?.map((item) => {
        const day = (item.times.toUpperCase() === 'D') ? 'hari' : 'minggu';
        console.log(item.service_code);
        const codCondition = (
          (item.service_code === 'REG19' || item.service_code === 'CTC19')
          && parseFloat(body.goods_amount || 0) <= parseFloat(5000000)
        );

        let discountApplied = this.selectedDiscount.value;
        if (this.selectedDiscount.type === 'PERCENTAGE') {
          discountApplied = (
            parseFloat(item.price) * parseFloat(this.selectedDiscount.value)
          ) / 100;
        }

        let totalCalculatedCod = item.price;
        let totalCalculatedNcod = item.price;
        let vatCalculated = this.selectedVat.value;
        let codCalculated = this.selectedFee?.codFee || 0;
        if (this.selectedFee?.codFeeType === 'PERCENTAGE') {
          codCalculated = (parseFloat(this.selectedFee?.codFee) * parseFloat(item.price)) / 100;
        }

        if (this.selectedVat.type === 'PERCENTAGE') {
          vatCalculated = (parseFloat(this.selectedVat.value) * parseFloat(item.price)) / 100;
        }

        const taxCalculated = parseFloat(codCalculated) + parseFloat(vatCalculated);

        if (codCondition) {
          totalCalculatedCod = (
            (parseFloat(item.price) * body.weight) + parseFloat(taxCalculated)
          ) - parseFloat(discountApplied);
        }

        if (!codCondition) {
          totalCalculatedNcod = (
            (parseFloat(item.price) * body.weight) + parseFloat(vatCalculated)
          ) - parseFloat(discountApplied);
        }
        let servCode = item.service_code;
        let servDisplay = item.service_display;
        if (item.service_code === 'CTCYES19') {
          servCode = 'YES19';
        }
        if (item.service_display === 'CTCYES') {
          servDisplay = 'YES';
        }

        if (item.service_code === 'CTCSPS19') {
          servCode = 'SPS19';
        }
        if (item.service_display === 'CTCSPS') {
          servDisplay = 'SPS';
        }


        return {
          weight: body.weight,
          serviceName: servDisplay === 'CTC' ? 'JNE REG' : servDisplay,
          serviceCode: servCode === 'CTC19' ? 'REG19' : servCode,
          availableCod: codCondition,
          originCod: true,
          destinationCod: true,
          estimation: `${item.etd_from} - ${item.etd_thru}`,
          estimationFormatted: `${item.etd_from} - ${item.etd_thru} ${day}`,
          price: item.price,
          priceFormatted: formatCurrency(item.price, 'Rp.'),
          type: 'JNE',
          discount: discountApplied,
          discount_raw: this.selectedDiscount,
          tax: taxCalculated,
          total_cod: totalCalculatedCod,
          total_non_cod: totalCalculatedNcod,
        };
      }) || [];
      // console.log((mapped.data).length);

      return mapped;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async sicepatFee() {
    try {
      const { body } = this.request;
      const prices = await this.sicepat.checkPrice({
        origin: this.origin.sicepatOriginCode,
        destination: this.destination.sicepatDestinationCode,
        weight: body.weight,
      });
      console.log(prices)
      const mapped = prices?.map((item) => {
        const rawEstimation = item.etd.split(' hari');
        const codCondition = (
          (item.service === 'SIUNT')
          && parseFloat(body.goods_amount || 0) <= parseFloat(5000000)
        );

        let discountApplied = this.selectedDiscount.value;
        if (this.selectedDiscount.type === 'PERCENTAGE') {
          discountApplied = (
            parseFloat(item.tariff) * parseFloat(this.selectedDiscount.value)
          ) / 100;
        }

        let totalCalculatedCod = item.tariff;
        let totalCalculatedNcod = item.tariff;
        let vatCalculated = this.selectedVat.value;
        let codCalculated = this.selectedFee?.codFee || 0;
        if (this.selectedFee?.codFeeType === 'PERCENTAGE') {
          codCalculated = (parseFloat(this.selectedFee?.codFee) * parseFloat(item.tariff)) / 100;
        }

        if (this.selectedVat.type === 'PERCENTAGE') {
          vatCalculated = (parseFloat(this.selectedVat.value) * parseFloat(item.tariff)) / 100;
        }

        const taxCalculated = parseFloat(codCalculated) + parseFloat(vatCalculated);

        if (codCondition) {
          totalCalculatedCod = (
            (parseFloat(item.tariff) * body.weight) + parseFloat(taxCalculated)
          ) - parseFloat(discountApplied);
        }

        if (!codCondition) {
          totalCalculatedNcod = (
            (parseFloat(item.tariff) * body.weight) + parseFloat(vatCalculated)
          ) - parseFloat(discountApplied);
        }


        return {
          weight: body.weight,
          serviceName: `Sicepat ${item.service}`,
          serviceCode: item.service,
          availableCod: codCondition,
          originCod: this.origin.sicepatCod ? true : false,
          destinationCod: this.destination.sicepatCod ? true : false,
          estimation: rawEstimation[0],
          estimationFormatted: `${item.etd?.toLowerCase()}`,
          price: item.tariff,
          priceFormatted: formatCurrency(item.tariff, 'Rp.'),
          type: 'SICEPAT',
          discount: discountApplied,
          discount_raw: this.selectedDiscount,
          tax: taxCalculated,
          total_cod: totalCalculatedCod,
          total_non_cod: totalCalculatedNcod,
        };
      }) || [];

      return mapped;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }

  async ninjaFee() {
    try {
      const { body } = this.request;
      const price = await this.ninja.checkPrice({
        weight: body.weight,
        origin: `${this.origin.ninjaOriginCode},${this.origin.ninjaDestinationCode}`,
        destination: `${this.destination.ninjaDestinationCode},${this.destination.ninjaDestinationCode}`,
        service: 'Standard',
      });
      // console.log(`price : ${price}`);
      let discountApplied = this.selectedDiscount.value;
      if (this.selectedDiscount.type === 'PERCENTAGE') {
        discountApplied = (
          parseFloat(price) * parseFloat(this.selectedDiscount.value)
        ) / 100;
      }

      let totalCalculatedCod = price;
      let totalCalculatedNcod = price;
      let vatCalculated = this.selectedVat.value;
      let codCalculated = this.selectedFee?.codFee || 0;
      if (this.selectedFee?.codFeeType === 'PERCENTAGE') {
        codCalculated = (parseFloat(this.selectedFee?.codFee) * parseFloat(price)) / 100;
      }

      if (this.selectedVat.type === 'PERCENTAGE') {
        vatCalculated = (parseFloat(this.selectedVat.value) * parseFloat(price)) / 100;
      }

      const service = 'Standard';
      const taxCalculated = parseFloat(codCalculated) + parseFloat(vatCalculated);

      if (service === 'Standard') {
        totalCalculatedCod = (
          (parseFloat(price) * body.weight) + parseFloat(taxCalculated)
        ) - parseFloat(discountApplied);
      } else {
        totalCalculatedNcod = (
          (parseFloat(price) * body.weight) + parseFloat(vatCalculated)
        ) - parseFloat(discountApplied);
      }

      return (price) ? [{
        price,
        weight: body.weight,
        serviceName: 'Ninja Reguler',
        serviceCode: 'Standard',
        estimation: '2 - 4',
        availableCod: true,
        originCod: true,
        destinationCod: true,
        estimationFormatted: '2 - 4 hari',
        priceFormatted: formatCurrency(price, 'Rp.'),
        type: 'NINJA',
        discount: discountApplied,
        discount_raw: this.selectedDiscount,
        tax: taxCalculated,
        total_cod: totalCalculatedCod,
        total_non_cod: totalCalculatedNcod,
      }] : [];
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }


  async sapFee() {
    try {
      const { body } = this.request;
      // console.log(this.origin.sapDistrictCode);
      // console.log(this.origin.sapDistrictCode);
      const prices2 = await this.sap.checkPrice({
        origin: this.origin.sapDistrictCode,
        destination: this.destination.sapDistrictCode,
        weight: body.weight,
      });
      console.log('before prices 2')
      console.log(prices2)
      console.log('after prices2')
      const prices_string = '[{"origin_name":"JAKARTA","destination_name":"PARAKAN,TEMANGGUNG","service_display":"JTR","service_code":"UDRREG","goods_type":"Paket","currency":"IDR","price":"65000","etd_from":"5","etd_thru":"6","times":"D"},{"origin_name":"JAKARTA","destination_name":"PARAKAN,TEMANGGUNG","service_display":"JTR250","service_code":"JTR250","goods_type":"Paket","currency":"IDR","price":"1350000","etd_from":"5","etd_thru":"6","times":"D"},{"origin_name":"JAKARTA","destination_name":"PARAKAN,TEMANGGUNG","service_display":"JTR>250","service_code":"JTR>250","goods_type":"Paket","currency":"IDR","price":"1800000","etd_from":"5","etd_thru":"6","times":"D"},{"origin_name":"JAKARTA","destination_name":"PARAKAN,TEMANGGUNG","service_display":"REG","service_code":"REG19","goods_type":"Document/Paket","currency":"IDR","price":"24000","etd_from":"3","etd_thru":"6","times":"D"},{"origin_name":"JAKARTA","destination_name":"PARAKAN,TEMANGGUNG","service_display":"JTR<150","service_code":"JTR<150","goods_type":"Paket","currency":"IDR","price":"800000","etd_from":"5","etd_thru":"6","times":"D"},{"origin_name":"JAKARTA","destination_name":"PARAKAN,TEMANGGUNG","service_display":"OKE","service_code":"OKE19","goods_type":"Document/Paket","currency":"IDR","price":"21000","etd_from":"4","etd_thru":"7","times":"D"}]';

      console.log('inside SAP fee')
      const sap_price_response = '{"origin":"JB07","destination":"JB07","weight":"1","coverage_cod":true,"price":{"REG": 17500},"price_detail":{"DRGREG":{"service_type_code":"REG","service_type_name":"REGULAR","unit_price":"3500","minimum_kilo":5,"price":17500,"sla":"2-3 Hari","sla_min":"2","sla_max":"3","id":"374353"}},"price_array":[{"service_type_code":"REG","service_type_name":"REGULAR","unit_price":"3500","minimum_kilo":5,"price":17500,"sla":"2-3 Hari","sla_min":"2","sla_max":"3","id":"374353"}]}';
      const prices_1 = JSON.parse(sap_price_response);
      const prices = prices_1.price_array
      console.log('====================');
      console.log(JSON.stringify(prices));
      console.log('------------------');

      const mapped = prices?.map((item) => {
        const rawEstimation = item.sla.split(' Hari');
        const codCondition = false; //ini mesti dilihat apa saja yg dukung COD
        let discountApplied = this.selectedDiscount.value;
        if (this.selectedDiscount.type === 'PERCENTAGE') {
          discountApplied = (
            parseFloat(item.price) * parseFloat(this.selectedDiscount.value)
          ) / 100;
        }

        let totalCalculatedCod = item.price;
        let totalCalculatedNcod = item.price;
        let vatCalculated = this.selectedVat.value;
        let codCalculated = this.selectedFee?.codFee || 0;

        if (this.selectedFee?.codFeeType === 'PERCENTAGE') {
          codCalculated = (parseFloat(this.selectedFee?.codFee) * parseFloat(item.tariff)) / 100;
        }

        if (this.selectedVat.type === 'PERCENTAGE') {
          vatCalculated = (parseFloat(this.selectedVat.value) * parseFloat(item.price)) / 100;
        }

        const taxCalculated = parseFloat(codCalculated) + parseFloat(vatCalculated);

        if (codCondition) {
          totalCalculatedCod = (
            (parseFloat(item.price) * body.weight) + parseFloat(taxCalculated)
          ) - parseFloat(discountApplied);
        }

        if (!codCondition) {
          totalCalculatedNcod = (
            (parseFloat(item.price) * body.weight) + parseFloat(vatCalculated)
          ) - parseFloat(discountApplied);
        }
        let servCode = item.service_type_code;
        let servDisplay = item.service_type_name;

        return {
          weight: body.weight,
          serviceName: servDisplay === 'CTC' ? 'JNE REG' : servDisplay,
          serviceCode: servCode === 'CTC19' ? 'REG19' : servCode,
          availableCod: codCondition,
          originCod: true,
          destinationCod: true,
          estimation: rawEstimation[0],
          estimationFormatted: item.sla,
          price: item.price,
          priceFormatted: formatCurrency(item.price, 'Rp.'),
          type: 'SAP',
          discount: discountApplied,
          discount_raw: this.selectedDiscount,
          tax: taxCalculated,
          total_cod: totalCalculatedCod,
          total_non_cod: totalCalculatedNcod,
        };
      }) || [];
      // console.log((mapped.data).length);

      return mapped;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }


  async idxFee() {
    try {
      const { body } = this.request;
      const prices = await Promise.all(
        idxServiceStatus.map(async (item) => {
          const price = await this.idexpress.checkPrice({
            weight: body.weight,
            origin: this.origin.idexpressOriginCode,
            destination: this.destination.idexpressDestinationCode,
            service: item.code,
          });

          return {
            price,
            code: item.code,
            name: item.name,
            estimation: item.estimation,
          };
        }),
      );

      const mapped = prices?.filter((item) => item.price)?.map((item) => {
        const rawEstimation = item.estimation.split(' hari');

        let discountApplied = this.selectedDiscount.value;
        if (this.selectedDiscount.type === 'PERCENTAGE') {
          discountApplied = (
            parseFloat(item.price) * parseFloat(this.selectedDiscount.value)
          ) / 100;
        }

        let totalCalculatedCod = item.price;
        let totalCalculatedNcod = item.price;
        let vatCalculated = this.selectedVat.value;
        let codCalculated = this.selectedFee?.codFee || 0;
        if (this.selectedFee?.codFeeType === 'PERCENTAGE') {
          codCalculated = (parseFloat(this.selectedFee?.codFee) * parseFloat(item.price)) / 100;
        }

        if (this.selectedVat.type === 'PERCENTAGE') {
          vatCalculated = (parseFloat(this.selectedVat.value) * parseFloat(item.price)) / 100;
        }

        const isCod = true;
        const taxCalculated = parseFloat(codCalculated) + parseFloat(vatCalculated);

        if (isCod) {
          totalCalculatedCod = (
            (parseFloat(item.price) * body.weight) + parseFloat(taxCalculated)
          ) - parseFloat(discountApplied);
        }

        if (isCod) {
          totalCalculatedNcod = (
            (parseFloat(item.price) * body.weight) + parseFloat(vatCalculated)
          ) - parseFloat(discountApplied);
        }

        return {
          weight: body.weight,
          price: item.price,
          serviceName: `IDX ${item.name}`,
          serviceCode: item.code,
          estimation: rawEstimation[0],
          estimationFormatted: item.estimation,
          priceFormatted: formatCurrency(item.price, 'Rp.'),
          type: 'IDEXPRESS',
          discount: discountApplied,
          discount_raw: this.selectedDiscount,
          tax: taxCalculated,
          total_cod: totalCalculatedCod,
          total_non_cod: totalCalculatedNcod,
        };
      }) || [];

      return mapped;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }
};
