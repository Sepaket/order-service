const table = 'order_discounts';

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.renameColumn(table, 'discount_seller', 'value'),
    queryInterface.removeColumn(table, 'discount_seller_type'),
    queryInterface.removeColumn(table, 'discount_provider'),
    queryInterface.removeColumn(table, 'discount_provider_type'),
    queryInterface.removeColumn(table, 'discount_global'),
    queryInterface.removeColumn(table, 'discount_global_type'),
  ]),

  down: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.renameColumn(table, 'value', 'discount_seller'),
    queryInterface.addColumn(table, 'discount_seller_type', {
      type: Sequelize.STRING,
      allowNull: true,
    }),
    queryInterface.addColumn(table, 'discount_provider', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    }),
    queryInterface.addColumn(table, 'discount_provider_type', {
      type: Sequelize.STRING,
      allowNull: true,
    }),
    queryInterface.addColumn(table, 'discount_global', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    }),
    queryInterface.addColumn(table, 'discount_global_type', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'this discount get from admin when admin set discount fee',
    }),
  ]),
};
