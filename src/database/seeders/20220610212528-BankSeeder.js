const table = 'banks';
const provinces = require('../templates/bank.json');

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
    queryInterface.bulkInsert(table, provinces.map((item) => ({
      name: item.name,
      code: item.code,
    }))),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
  ]),
};
