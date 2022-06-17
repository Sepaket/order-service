const { SellerAddress } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      try {
        this.seller = await jwtSelector({ request: this.request });
        const parameter = this.parameterMapper();
        const { body } = this.request;

        await SellerAddress.update(
          { ...parameter },
          { where: { id: body.id } },
        );

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  parameterMapper() {
    const { body } = this.request;

    return {
      sellerId: this.seller?.id,
      name: body.name,
      picName: body.pic_name,
      picPhoneNumber: body.pic_phone,
      address: body.address,
      addressDetail: body.address_detail,
      active: body.status,
    };
  }
};
