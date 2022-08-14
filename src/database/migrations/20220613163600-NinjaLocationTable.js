const table = 'ninja_locations';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      province: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      district: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location_code_1: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location_code_2: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['location_code_1'], name: 'location_code_1_ninja_locations_idx' }),
      queryInterface.addIndex(table, { fields: ['location_code_2'], name: 'location_code_2_ninja_locations_idx' }),
      queryInterface.addIndex(table, { fields: ['province'], name: 'province_ninja_locations_idx' }),
      queryInterface.addIndex(table, { fields: ['city'], name: 'city_ninja_locations_idx' }),
      queryInterface.addIndex(table, { fields: ['district'], name: 'district_ninja_locations_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
