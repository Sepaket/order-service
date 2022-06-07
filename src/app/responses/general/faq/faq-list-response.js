const httpErrors = require('http-errors');
const { Sequelize } = require('sequelize');
const { Faq, FaqCategory } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.faq = Faq;
    this.faqCategory = FaqCategory;
    this.op = Sequelize.Op;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  async process() {
    const limit = 10;
    const offset = 0;
    const { query } = this.request;
    const search = this.querySearch();
    const total = await this.faq.count();
    const nextPage = (
      (parseInt(query.page, 10) - parseInt(1, 10)) * parseInt(10, 10)
    ) || parseInt(offset, 10);

    return new Promise((resolve, reject) => {
      try {
        this.faq.findAll({
          attributes: [
            ['id', 'faq_id'],
            'answer',
            'question',
          ],
          include: [
            {
              attributes: [
                ['id', 'category_id'],
                'name',
                'icon',
              ],
              model: this.faqCategory,
              as: 'category',
              required: true,
            },
          ],
          where: search,
          order: [['question', 'ASC']],
          limit: parseInt(query.limit, 10) || parseInt(limit, 10),
          offset: nextPage,
        }).then((response) => {
          const result = this.converter.arrayToSnakeCase(
            JSON.parse(JSON.stringify(response)),
          );

          if (result.length > 0) {
            resolve({
              data: result,
              meta: {
                total,
                total_result: result.length,
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
                  total_result: result.length,
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
    const condition = {
      [this.op.or]: {
        answer: {
          [this.op.substring]: query.keyword,
        },
        question: {
          [this.op.substring]: query.keyword,
        },
      },
    };

    return query.keyword ? condition : {};
  }
};
