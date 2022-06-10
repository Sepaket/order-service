const httpErrors = require('http-errors');
const { Faq, FaqCategory } = require('../../../models');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.faq = Faq;
    this.faqCategory = FaqCategory;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise((resolve, reject) => {
      const { params } = this.request;

      this.faq.findOne({
        attributes: [
          ['id', 'faq_id'],
          'question',
          'answer',
        ],
        where: { id: params.id },
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
      }).then((response) => {
        const result = this.converter.objectToSnakeCase(
          JSON.parse(JSON.stringify(response)),
        );

        if (response) resolve(result);
        else reject(httpErrors(404, 'No Data Found', { data: null }));
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
