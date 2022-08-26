const table = 'order_backgrounds';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(table, 'resi', {
      type: Sequelize.STRING,
      defaultValue: '',
      allowNull: false,
    }),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.removeColumn(table, 'resi'),
  ]),
};
