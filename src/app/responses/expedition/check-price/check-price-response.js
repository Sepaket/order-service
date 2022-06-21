// const httpErrors = require('http-errors');
const jne = require('../../../../helpers/jne');
const { Location } = require('../../../models');
const ninja = require('../../../../helpers/ninja');
const sicepat = require('../../../../helpers/sicepat');
const idexpress = require('../../../../helpers/idexpress');
const { idxServiceStatus } = require('../../../../constant/status');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const { formatCurrency } = require('../../../../helpers/currency-converter');

module.exports = class {
  constructor({ request }) {
    this.jne = jne;
    this.ninja = ninja;
    this.request = request;
    this.sicepat = sicepat;
    this.location = Location;
    this.idexpress = idexpress;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        let result = [];
        const { body } = this.request;
        this.origin = await this.location.findOne({ where: { id: body.origin } });
        this.destination = await this.location.findOne({ where: { id: body.destination } });
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

      const idxCondition = (
        this.origin.idexpressOriginCode !== '' && this.destination.idexpressDestinationCode !== ''
      );

      if (body.type === 'JNE' && jneCondition) {
        const jnePrices = await this.jneFee();
        if (jnePrices?.length > 0) fees.push(jnePrices);
      }

      if (body.type === 'SICEPAT' && sicepatCondition) {
        const sicepatPrices = await this.sicepatFee();
        if (sicepatPrices?.length > 0) fees.push(sicepatPrices);
      }

      if (body.type === 'NINJA' && ninjaCondition) {
        const ninjaPrices = await this.ninjaFee();
        if (ninjaPrices?.length > 0) fees.push(ninjaPrices);
      }

      if (body.type === 'IDEXPRESS' && idxCondition) {
        const idxPrice = await this.idxFee();
        if (idxPrice?.length > 0) fees.push(idxPrice);
      }

      if (body.type === 'ALL') {
        let result = [];
        const jnePrices = await this.jneFee();
        const sicepatPrices = await this.sicepatFee();
        const ninjaPrices = await this.ninjaFee();
        const idxPrice = await this.idxFee();

        result = result.concat(jnePrices);
        result = result.concat(sicepatPrices);
        result = result.concat(ninjaPrices);
        result = result.concat(idxPrice);

        fees.push(result);
      }

      return fees;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
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

      const mapped = prices?.filter((item) => item.times)?.map((item) => {
        const day = (item.times.toUpperCase() === 'D') ? 'hari' : 'minggu';

        return {
          serviceName: item.service_display,
          serviceCode: item.service_code,
          estimation: `${item.etd_from} - ${item.etd_thru}`,
          estimationFormatted: `${item.etd_from} - ${item.etd_thru} ${day}`,
          price: item.price,
          priceFormatted: formatCurrency(item.price, 'Rp.'),
          type: 'JNE',
        };
      }) || [];

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

      const mapped = prices?.map((item) => {
        const rawEstimation = item.etd.split(' hari');

        return {
          serviceName: `Sicepat ${item.service}`,
          serviceCode: item.service,
          estimation: rawEstimation[0],
          estimationFormatted: `${item.etd?.toLowerCase()}`,
          price: item.tariff,
          priceFormatted: formatCurrency(item.tariff, 'Rp.'),
          type: 'SICEPAT',
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
        origin: this.origin.ninjaOriginCode,
        destination: this.destination.ninjaDestinationCode,
        service: 'Standard',
      });

      return (price) ? [{
        price,
        serviceName: 'Ninja Reguler',
        serviceCode: 'Standard',
        estimation: '2 - 4',
        estimationFormatted: '2 - 4 hari',
        priceFormatted: formatCurrency(price, 'Rp.'),
        type: 'NINJA',
      }] : [];
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

      const mapped = prices?.map((item) => {
        const rawEstimation = item.estimation.split(' hari');

        return {
          serviceName: `IDX ${item.name}`,
          serviceCode: item.code,
          estimation: rawEstimation[0],
          estimationFormatted: item.estimation,
          priceFormatted: formatCurrency(item.price, 'Rp.'),
          type: 'IDEXPRESS',
        };
      }) || [];

      return mapped;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }
};
