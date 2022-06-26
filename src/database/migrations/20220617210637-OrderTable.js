const table = 'orders';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      resi: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      expedition: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      service_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_cod: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      order_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      order_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
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
      queryInterface.addIndex(table, { fields: ['resi'], name: 'resi_order_idx' }),
      queryInterface.addIndex(table, { fields: ['expedition'], name: 'expedition_order_idx' }),
      queryInterface.addIndex(table, { fields: ['order_date'], name: 'order_date_order_idx' }),
      queryInterface.addIndex(table, { fields: ['order_time'], name: 'order_time_order_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
