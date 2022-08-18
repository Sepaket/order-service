const table = 'order_details';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(table, 'seller_received_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    }),
    queryInterface.addColumn(table, 'cod_fee', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    }),
    queryInterface.removeColumn(table, 'goods_price'),
  ]),

  down: async () => Promise.all([]),
};
