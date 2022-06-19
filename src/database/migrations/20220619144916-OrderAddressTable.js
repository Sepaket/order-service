const table = 'order_addresses';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      sender_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sender_phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      receiver_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      receiver_phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      receiver_address: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      receiver_address_note: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      receiver_location_id: {
        type: Sequelize.INTEGER,
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
      queryInterface.addIndex(table, { fields: ['sender_name'], name: 'sender_name_order_address_idx' }),
      queryInterface.addIndex(table, { fields: ['sender_phone'], name: 'sender_phone_order_address_idx' }),
      queryInterface.addIndex(table, { fields: ['receiver_name'], name: 'receiver_name_order_address_idx' }),
      queryInterface.addIndex(table, { fields: ['receiver_phone'], name: 'receiver_phone_order_address_idx' }),
      queryInterface.addIndex(table, { fields: ['receiver_address'], name: 'receiver_address_order_address_idx' }),
      queryInterface.addIndex(table, { fields: ['receiver_location_id'], name: 'receiver_location_id_order_address_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
