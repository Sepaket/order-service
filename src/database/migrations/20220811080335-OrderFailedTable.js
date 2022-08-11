const table = 'order_faileds';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      batch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: false,
      },
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['batch_id'], name: 'batch_id_order_failed_idx' }),
      queryInterface.addIndex(table, { fields: ['seller_id'], name: 'seller_id_order_failed_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
