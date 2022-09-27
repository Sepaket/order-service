const table = 'seller_referals';

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
      member_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'get this id from seller register with referal code',
      },
      referal_code: {
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
      queryInterface.addIndex(table, { fields: ['seller_id'], name: `seller_id_${table}_idx` }),
      queryInterface.addIndex(table, { fields: ['member_id'], name: `member_id_${table}_idx` }),
      queryInterface.addIndex(table, { fields: ['referal_code'], name: `referal_code_${table}_idx` }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
