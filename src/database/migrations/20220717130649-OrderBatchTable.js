const table = 'order_batch';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      seller_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      batch_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expedition: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      total_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_order_sent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_order_processed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_order_problem: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['batch_code'], name: `batch_code_${table}_idx` }),
      queryInterface.addIndex(table, { fields: ['total_order'], name: `total_order_${table}_idx` }),
      queryInterface.addIndex(table, { fields: ['total_order_sent'], name: `total_order_sent_${table}_idx` }),
      queryInterface.addIndex(table, { fields: ['total_order_problem'], name: `total_order_problem_${table}_idx` }),
      queryInterface.addIndex(table, { fields: ['total_order_processed'], name: `total_order_processed_${table}_idx` }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
