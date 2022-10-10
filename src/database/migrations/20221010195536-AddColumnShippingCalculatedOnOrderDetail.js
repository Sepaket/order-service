const table = 'order_details';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(table, 'shipping_calculated', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    }),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.removeColumn(table, 'shipping_calculated'),
  ]),
};
