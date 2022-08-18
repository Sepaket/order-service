const table = 'order_discounts';

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
      discount_seller: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      discount_seller_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      discount_provider: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      discount_provider_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      discount_global: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      discount_global_type: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'this discount get from admin when admin set discount fee',
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
      queryInterface.addIndex(table, { fields: ['order_id'], name: 'order_id_order_discount_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
