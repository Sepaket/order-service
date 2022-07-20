const table = 'orders';

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.removeColumn(table, 'total_amount'),
  ]),

  down: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(table, 'total_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    }),
  ]),
};
