const moment = require('moment');
const { Op } = require('sequelize');
const { Order, OrderDetail } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.request = request;
    this.order = Order;
    return this.process();
  }

  async process() {
    const seller = await jwtSelector({ request: this.request });
    return new Promise(async (resolve, reject) => {
      try {
        this.seller = await jwtSelector({ request: this.request });

        this.order.findAll({
          where: {
            '$detail.seller_id$': seller.id,
            status: {
              [Op.or]: ['PROCESSED', 'WAITING_PICKUP']
            },
            // status: 'PROCESSED',
            isCod: true,
            ...this.querySearch(),
          },
          include: [{
            model: OrderDetail,
            as: 'detail',
          }],
        }).then((response) => {
          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  querySearch() {
    const { query } = this.request;
    let filtered = {};
    const condition = {};

    if (query?.keyword) {
      condition[this.op.or] = {
        resi: { [this.op.substring]: query?.keyword?.toUpperCase() || '' },
      };
    }

    if (query?.filter_by === 'DATE') {
      filtered = {
        updatedAt: {
          [this.op.between]: [
            moment(query.date_start).startOf('day').format(),
            moment(query.date_end).endOf('day').format(),
          ],
        },
      };
    }

    if (query.filter_by === 'MONTH') {
      filtered = {
        updatedAt: {
          [this.op.between]: [
            moment(query.date_start).startOf('month').format(),
            moment(query.date_end).endOf('month').format(),
          ],
        },
      };
    }

    if (query.filter_by === 'YEAR') {
      filtered = {
        updatedAt: {
          [this.op.between]: [
            moment(query.date_start).startOf('year').format(),
            moment(query.date_end).endOf('year').format(),
          ],
        },
      };
    }

    // condition.status = {
    //   [this.op.notIn]: [
    //     'WAITING_PICKUP', 'PROCESSED', 'PROBLEM',
    //   ],
    // };


    if (query?.type) {
      condition.is_cod = query.type === 'cod';
    }


    return condition;
  }

};
