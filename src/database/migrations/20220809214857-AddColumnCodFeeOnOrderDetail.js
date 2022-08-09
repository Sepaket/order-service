const table = 'order_details';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(table, 'cod_fee_admin', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    }),
    queryInterface.addColumn(table, 'cod_fee_admin_type', {
      type: Sequelize.STRING,
      allowNull: true,
    }),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.removeColumn(table, 'cod_fee'),
    queryInterface.removeColumn(table, 'cod_fee_type'),
  ]),
};
