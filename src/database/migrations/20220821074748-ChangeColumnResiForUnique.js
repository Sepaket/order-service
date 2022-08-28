const table = 'orders';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.changeColumn(table, 'resi', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false,
    }).then(() => [
      queryInterface.removeIndex(table, 'resi_order_idx'),
      queryInterface.removeConstraint(table, 'orders_resi_key'),
    ]),
  ]),

  down: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.changeColumn(table, 'resi', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false,
    }),
  ]),
};
