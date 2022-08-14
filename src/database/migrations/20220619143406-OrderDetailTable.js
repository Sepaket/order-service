const table = 'order_details';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      seller_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      seller_address_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      weight: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      volume: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      total_item: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      goods_content: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      goods_price: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      shipping_charge: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      use_insurance: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      insurance_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      is_trouble: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
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
      queryInterface.addIndex(table, { fields: ['order_id'], name: 'order_id_order_detail_idx' }),
      queryInterface.addIndex(table, { fields: ['seller_id'], name: 'seller_id_order_detail_idx' }),
      queryInterface.addIndex(table, { fields: ['seller_address_id'], name: 'seller_address_id_order_detail_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
