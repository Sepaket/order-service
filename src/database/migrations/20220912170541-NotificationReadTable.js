const table = 'notification_reads';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      notification_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      seller_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['notification_id'], name: 'notification_id_notification_reads_idx' }),
      queryInterface.addIndex(table, { fields: ['seller_id'], name: 'seller_id_notification_reads_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
