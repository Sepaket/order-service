const table = 'sub_districts';

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
      district_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      postal_code: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    }).then(() => [
      queryInterface.addIndex(table, { fields: ['name'], name: 'name_sub_district_idx' }),
      queryInterface.addIndex(table, { fields: ['province_id'], name: 'province_id_sub_district_idx' }),
      queryInterface.addIndex(table, { fields: ['city_id'], name: 'city_id_sub_district_idx' }),
      queryInterface.addIndex(table, { fields: ['district_id'], name: 'district_id_sub_district_idx' }),
      queryInterface.addIndex(table, { fields: ['postal_code'], name: 'postal_code_sub_district_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.dropTable(table),
  ]),
};
