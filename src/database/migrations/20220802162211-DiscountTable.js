const table = 'discounts';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      minimum_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true,
      },
      maximum_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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
      queryInterface.addIndex(table, { fields: ['value'], name: 'value_discount_idx' }),
      queryInterface.addIndex(table, { fields: ['minimum_order'], name: 'minimum_order_discount_idx' }),
      queryInterface.addIndex(table, { fields: ['maximum_order'], name: 'maximum_order_discount_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
