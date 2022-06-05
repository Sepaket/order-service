const table = 'districts';

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
      city_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['name'], name: 'name_district_idx' }),
      queryInterface.addIndex(table, { fields: ['province_id'], name: 'province_id_district_idx' }),
      queryInterface.addIndex(table, { fields: ['city_id'], name: 'city_id_district_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
