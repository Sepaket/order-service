const table = 'faq_categories';
const provinces = require('../templates/faq-category.json');

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
    queryInterface.bulkInsert(table, provinces.map((item) => ({
      id: item.kategori_id,
      name: item.kategori_nama,
      icon: item.kategori_icon,
    }))),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
  ]),
};
