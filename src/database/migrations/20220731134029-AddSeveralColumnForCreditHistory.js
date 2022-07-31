const table = 'credit_histories';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(table, 'external_id', {
      type: Sequelize.STRING,
      allowNull: true,
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['external_id'], name: 'external_id_credit_history_idx' }),
    ]),

    queryInterface.addColumn(table, 'provider', {
      type: Sequelize.STRING,
      allowNull: true,
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['provider'], name: 'provider_credit_history_idx' }),
    ]),

    queryInterface.addColumn(table, 'request_payload', {
      type: Sequelize.JSON,
      allowNull: true,
    }),

    queryInterface.addColumn(table, 'response_payload', {
      type: Sequelize.JSON,
      allowNull: true,
    }),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.removeColumn(table, 'external_id'),
    queryInterface.removeColumn(table, 'provider'),
    queryInterface.removeColumn(table, 'request_payload'),
    queryInterface.removeColumn(table, 'response_payload'),
  ]),
};
