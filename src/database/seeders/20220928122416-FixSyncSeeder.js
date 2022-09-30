const { sequelize } = require('../../app/models');

const tables = [
  'admins',
  'banks',
  'credit_histories',
  'discounts',
  'faq_categories',
  'faqs',
  'idx_locations',
  'insurances',
  'locations',
  'ninja_locations',
  'notification_reads',
  'notifications',
  'order_addresses',
  'order_backgrounds',
  'order_batch',
  'order_canceleds',
  'order_details',
  'order_discounts',
  'order_faileds',
  'order_logs',
  'order_taxes',
  'orders',
  'seller_addresses',
  'seller_details',
  'sellers',
  'transaction_fees',
  'tickets',
];

module.exports = {
  up: async () => Promise.all(
    tables.map(async (table) => {
      try {
        const typeId = await sequelize.query(`
          SELECT
              column_name,
              data_type,
              character_maximum_length AS max_length,
              character_octet_length AS octet_length
          FROM
              information_schema.columns
          WHERE
              table_schema = 'public' AND
              table_name = '${table}' AND
              column_name = 'id'
        `);

        if (typeId[0][0].data_type === 'integer') {
          const seq = `${table}_id_seq`;
          await sequelize.query(`SELECT setval('${seq}', COALESCE((SELECT MAX(id)+1 FROM ${table}), 1), false);`);
        }
      } catch (error) {
        /* eslint-disable no-console */
        console.log(error?.message);
      }
    }),
  ),
};
