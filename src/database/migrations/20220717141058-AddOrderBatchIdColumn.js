const tableOrder = 'orders';
const tableOrderDetail = 'order_details';

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(tableOrder, 'batch_id', {
      type: Sequelize.INTEGER,
    }).then(() => [
      queryInterface.addIndex(tableOrder, { fields: ['batch_id'], name: 'batch_id_order_idx' }),
    ]),

    queryInterface.addColumn(tableOrderDetail, 'batch_id', {
      type: Sequelize.INTEGER,
    }).then(() => [
      queryInterface.addIndex(tableOrderDetail, { fields: ['batch_id'], name: 'batch_id_order_detail_idx' }),
    ]),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.removeColumn(tableOrder, 'batch_id'),
    queryInterface.removeColumn(tableOrderDetail, 'batch_id'),
  ]),
};
