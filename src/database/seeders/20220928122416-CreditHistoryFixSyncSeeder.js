const table = 'credit_histories';
const { sequelize } = require('../../app/models');

module.exports = {
  up: async () => new Promise(async (resolve) => {
    const seq = `${table}_id_seq`;
    await sequelize.query('BEGIN;');
    await sequelize.query(`LOCK TABLE ${table} IN EXCLUSIVE MODE`);
    await sequelize.query(`SELECT setval('${seq}', COALESCE((SELECT MAX(id)+1 FROM ${table}), 1), false);`);
    await sequelize.query('COMMIT');
    resolve(true);
  }),
};
