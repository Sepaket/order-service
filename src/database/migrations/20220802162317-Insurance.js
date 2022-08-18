const table = 'insurances';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      expedition: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      insurance_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      insurance_value_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      admin_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      admin_fee_type: {
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
      queryInterface.addIndex(table, { fields: ['expedition'], name: 'expedition_insurance_idx' }),
      queryInterface.addIndex(table, { fields: ['insurance_value'], name: 'insurance_value_insurance_idx' }),
      queryInterface.addIndex(table, { fields: ['admin_fee'], name: 'admin_fee_insurance_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
