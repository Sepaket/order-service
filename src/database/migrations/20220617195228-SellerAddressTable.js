const table = 'seller_addresses';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      seller_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
      },
      pic_name: {
        type: Sequelize.STRING,
      },
      pic_phone_number: {
        type: Sequelize.STRING,
      },
      address: {
        type: Sequelize.STRING,
      },
      address_detail: {
        type: Sequelize.STRING,
      },
      active: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: true,
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
      queryInterface.addIndex(table, { fields: ['name'], name: `name_${table}_idx` }),
      queryInterface.addIndex(table, { fields: ['pic_name'], name: `pic_name_${table}_idx` }),
      queryInterface.addIndex(table, { fields: ['pic_phone_number'], name: `pic_phone_number_${table}_idx` }),
      queryInterface.addIndex(table, { fields: ['address'], name: `address_${table}_idx` }),
      queryInterface.addIndex(table, { fields: ['address_detail'], name: `address_detail_${table}_idx` }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
