const table = 'transaction_fees';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      cod_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      cod_fee_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      rate_referal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      rate_referal_type: {
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
      queryInterface.addIndex(table, { fields: ['cod_fee'], name: 'cod_fee_transaction_fee_idx' }),
      queryInterface.addIndex(table, { fields: ['rate_referal'], name: 'rate_referal_transaction_fee_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
