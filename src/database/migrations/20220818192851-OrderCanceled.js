const table = 'order_canceleds';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      parameter: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      is_execute: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      },
      expedition: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['expedition'], name: 'expedition_order_cancled_idx' }),
      queryInterface.addIndex(table, { fields: ['is_execute'], name: 'is_execute_order_cancled_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
