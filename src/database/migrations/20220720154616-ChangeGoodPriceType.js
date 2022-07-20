const table = 'order_details';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(table, 'goods_price', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
    }),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.removeColumn(table, 'goods_price'),
  ]),
};
