const table = 'seller_details';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(table, 'cod_fee', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    }),
    queryInterface.addColumn(table, 'cod_fee_type', {
      type: Sequelize.STRING,
      allowNull: true,
    }),
    queryInterface.addColumn(table, 'discount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    }),
    queryInterface.addColumn(table, 'discount_type', {
      type: Sequelize.STRING,
      allowNull: true,
    }),
    queryInterface.addColumn(table, 'rate_referal', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    }),
    queryInterface.addColumn(table, 'rate_referal_type', {
      type: Sequelize.STRING,
      allowNull: true,
    }),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.removeColumn(table, 'cod_fee'),
    queryInterface.removeColumn(table, 'cod_fee_type'),
    queryInterface.removeColumn(table, 'discount'),
    queryInterface.removeColumn(table, 'discount_type'),
    queryInterface.removeColumn(table, 'rate_referal'),
    queryInterface.removeColumn(table, 'rate_referal_type'),
  ]),
};
