// const httpErrors = require('http-errors');
const jne = require('../../../helpers/jne');
const ninja = require('../../../helpers/ninja');
const sicepat = require('../../../helpers/sicepat');
const snakeCaseConverter = require('../../../helpers/snakecase-converter');
const { getRedisData } = require('../../../helpers/redis');
const { Location } = require('../../models');

module.exports = class {
  constructor({ request }) {
    this.jne = jne;
    this.ninja = ninja;
    this.request = request;
    this.sicepat = sicepat;
    this.location = Location;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        const { body } = this.request;
        this.origin = await this.location.findOne({ where: { id: body.origin } });
        this.destination = await this.location.findOne({ where: { id: body.destination } });
        // const originCode = await this.originCode();
        // const destinationCode = this.destinationCode();

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  async originCode() {
    try {
      const { body } = this.request;
      const originString = await getRedisData({ db: 3, key: 'origins' });
      const origins = JSON.parse(originString);

      if (origins?.length < 1) throw new Error('Service has not ready yet, try again later');

      const location = origins
        .filter((item) => item.type === body?.type?.toLowerCase())
        .find((item) => {
          const condition = (
            item?.name?.toLowerCase()?.includes(this.origin?.provinceName?.toLowerCase())
            || item?.name?.toLowerCase()?.includes(this.origin?.cityName?.toLowerCase())
            || item?.name?.toLowerCase()?.includes(this.origin?.districtName?.toLowerCase())
            || item?.name?.toLowerCase()?.includes(this.origin?.subDistrictName?.toLowerCase())
          );

          if (condition) return item;
          return null;
        });

      return location;
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  // async destinationCode() {
  //   return true;
  // }
};
