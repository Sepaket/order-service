const table = 'faqs';
const provinces = require('../templates/faq.json');

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
    queryInterface.bulkInsert(table, provinces.map((item) => ({
      id: item.faq_id,
      question: item.faq_pertanyaan,
      answer: item.faq_jawaban,
      category_id: item.faq_kategori,
    }))),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
  ]),
};
