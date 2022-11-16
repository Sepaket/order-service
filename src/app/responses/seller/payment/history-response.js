const moment = require('moment');
const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { CreditHistory, SellerDetail } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');
const jwtSelector = require('../../../../helpers/jwt-selector');

module.exports = class {
  constructor({ request }) {
    this.op = Sequelize.Op;
    this.request = request;
    this.credit = CreditHistory;
    this.sellerDetail = SellerDetail;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const limit = 10;
    const offset = 0;
    const { query } = this.request;
    const search = this.querySearch();
    const seller = await jwtSelector({ request: this.request });
    const total = await this.credit.count({
      where: { sellerId: seller.id },
    });

    const nextPage = (
      (parseInt(query.page, 10) - parseInt(1, 10)) * parseInt(10, 10)
    ) || parseInt(offset, 10);

    return new Promise((resolve, reject) => {
      try {
        this.credit.findAll({
          attributes: [
            ['id', 'credit_id'],
            'status',
            'topup',
            'withdraw',
            'updatedAt',
          ],
          where: { ...search, sellerId: seller.id },
          order: [['id', 'DESC']],
          limit: parseInt(query.limit, 10) || parseInt(limit, 10),
          offset: nextPage,
        }).then((response) => {
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          const mapped = result?.map((item) => ({
            ...item,
            type: item?.topup ? 'TOPUP' : 'WITHDRAW',
            description: item?.topup ? 'Topup Saldo' : 'Tarik Saldo',
          }));

          if (mapped.length > 0) {
            resolve({
              data: mapped,
              meta: {
                total,
                total_result: mapped.length,
                limit: parseInt(query.limit, 10) || limit,
                page: parseInt(query.page, 10) || (offset + 1),
              },
            });
          } else {
            reject(httpErrors(404, 'No Data Found', {
              data: {
                data: [],
                meta: {
                  total,
                  total_result: 0,
                  limit: parseInt(query.limit, 10) || limit,
                  page: parseInt(query.page, 10) || (offset + 1),
                },
              },
            }));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  querySearch() {
    const { query } = this.request;
    let filtered = {};
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
      console.log("filder by month");
      filtered = {
        updatedAt: {
          [this.op.between]: [
            // moment(query.date_start, 'M').startOf('month').format(),
            // moment(query.date_start, 'M').endOf('month').format(),
            moment(query.date_start).startOf('month').format(),
            moment(query.date_end).endOf('month').format(),
          ],
        },
      };
    }

    if (query.filter_by === 'YEAR') {
      console.log("filder by YEAR");
      filtered = {
        updatedAt: {
          [this.op.between]: [
            moment(query.date_start).startOf('year').format(),
            moment(query.date_start).endOf('year').format(),
            // moment(query.date_start, 'YYYY').startOf('year').format(),
            // moment(query.date_start, 'YYYY').endOf('year').format(),
          ],
        },
      };
    }

    const condition = {
      [this.op.or]: {
        status: { [this.op.eq]: query?.status || '' },
      },
      [this.op.and]: {
        ...filtered,
      },
    };

    if (!query?.status) delete condition[this.op.or];

    return query?.status || query?.filter_by ? condition : {};
  }
};
