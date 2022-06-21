// const httpErrors = require('http-errors');
const jne = require('../../../../helpers/jne');
const { Location } = require('../../../models');
const ninja = require('../../../../helpers/ninja');
const sicepat = require('../../../../helpers/sicepat');
const idexpress = require('../../../../helpers/idexpress');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

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
        const { body } = this.request;
        this.origin = await this.location.findOne({ where: { id: body.origin } });
        this.destination = await this.location.findOne({ where: { id: body.destination } });
        const result = await this.createOrder();

        resolve({
          data: result,
          meta: null,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async createOrder() {
    try {
      const { body } = this.request;
      let order = null;

      const jneCondition = (
        this.origin.jneOriginCode !== '' && this.destination.jneDestinationCode !== ''
      );

      if (body.type === 'JNE' && !jneCondition) {
        order = await this.jne.createOrder({
          origin: this.origin.jneOriginCode,
          destination: this.destination.jneDestinationCode,
          weight: body.weight,
        });
      }

      return order;
    } catch (error) {
      throw new Error(error?.message || 'Something Wrong');
    }
  }
};
