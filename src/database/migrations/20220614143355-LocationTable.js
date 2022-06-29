const table = 'locations';

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
      sub_district: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      postal_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jne_origin_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      jne_destination_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sicepat_origin_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sicepat_destination_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ninja_origin_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ninja_destination_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      idexpress_origin_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      idexpress_destination_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['province'], name: 'province_location_idx' }),
      queryInterface.addIndex(table, { fields: ['city'], name: 'city_location_idx' }),
      queryInterface.addIndex(table, { fields: ['district'], name: 'district_location_idx' }),
      queryInterface.addIndex(table, { fields: ['sub_district'], name: 'sub_district_location_idx' }),
      queryInterface.addIndex(table, { fields: ['postal_code'], name: 'postal_code_location_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
