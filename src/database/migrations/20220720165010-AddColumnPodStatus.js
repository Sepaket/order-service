const table = 'orders';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(table, 'pod_status', {
      type: Sequelize.STRING,
      allowNull: true,
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['pod_status'], name: 'pod_status_order_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.removeColumn(table, 'pod_status'),
  ]),
};
