const table = 'provinces';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['name'], name: 'name_province_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
