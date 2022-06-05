const table = 'cities';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      province_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['name'], name: 'name_city_idx' }),
      queryInterface.addIndex(table, { fields: ['province_id'], name: 'province_id_city_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
