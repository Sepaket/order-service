const table = 'seller_addresses';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(table, 'hide_in_resi', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    }),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.removeColumn(table, 'hide_in_resi'),
  ]),
};
