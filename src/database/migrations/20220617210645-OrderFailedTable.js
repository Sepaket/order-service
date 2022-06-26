const table = 'order_faileds';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      resi: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      request: {
        type: Sequelize.JSON,
        allowNull: false,
      },
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['resi'], name: 'resi_order_failed_idx' }),
      queryInterface.addIndex(table, { fields: ['provider'], name: 'provider_order_failed_idx' }),
      queryInterface.addIndex(table, { fields: ['url'], name: 'url_order_failed_idx' }),
      queryInterface.addIndex(table, { fields: ['reason'], name: 'reason_order_failed_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
