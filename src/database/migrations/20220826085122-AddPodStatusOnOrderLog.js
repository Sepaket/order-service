const table = 'order_logs';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(table, 'pod_status', {
      type: Sequelize.STRING,
      allowNull: true,
    }),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.removeColumn(table, 'pod_status'),
  ]),
};
