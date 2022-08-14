const table = 'admins';
const bcrypt = require('bcrypt');
const roles = require('../../constant/role');
const admins = require('../templates/admin.json');

const roleMapper = (role) => {
  let selectedRole = roles.STAFF.text;
  if (role?.includes('Admin')) selectedRole = roles.SUPER_ADMIN.text;
  if (role?.includes('Last_Mile')) selectedRole = roles.LAST_MILE.text;
  if (role?.includes('Finance')) selectedRole = roles.FINANCE.text;
  if (role?.includes('Control_tower')) selectedRole = roles.CONTROL_TOWER.text;

  return selectedRole;
};

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
    queryInterface.bulkInsert(table, admins.map((item) => ({
      email: item.user_email,
      password: bcrypt.hashSync('Sep@ket123', 10),
      name: item.user_username,
      phone: item.user_telp,
      role: `${roleMapper(item.user_role)}`,
      is_new: false,
    }))),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(table, null, { truncate: true }),
  ]),
};
