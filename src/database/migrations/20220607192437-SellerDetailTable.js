const table = 'seller_details';

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
        allowNull: true,
      },
      photo: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      credit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      bank_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      bank_account_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bank_account_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referal_code: {
        type: Sequelize.STRING,
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
      queryInterface.addIndex(table, { fields: ['seller_id'], name: 'seller_id_seller_detail_idx' }),
      queryInterface.addIndex(table, { fields: ['bank_account_number'], name: 'bank_account_number_seller_detail_idx' }),
      queryInterface.addIndex(table, { fields: ['referal_code'], name: 'referal_code_seller_detail_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
