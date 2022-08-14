const table = 'orders';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(table, 'order_code', {
      type: Sequelize.STRING,
      after: 'resi',
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['order_code'], name: 'order_code_order_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.removeColumn(table, 'order_code'),
  ]),
};
