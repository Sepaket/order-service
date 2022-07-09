const sellerDetailTable = 'seller_details';
const sellerTable = 'sellers';
const sellers = require('../templates/seller.json');

module.exports = {
  up: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(sellerTable, null, { truncate: true }),
    queryInterface.bulkDelete(sellerDetailTable, null, { truncate: true }),

    queryInterface.bulkInsert(sellerTable, sellers.map((item) => ({
      email: item.user_email,
      password: item.user_password,
      name: item.user_username,
      phone: item.user_telp,
      is_verified: !!item.user_verfikasi,
      is_new: false,
    }))),

    queryInterface.bulkInsert(sellerDetailTable, sellers.map((item, index) => ({
      seller_id: parseInt(index, 10) + parseInt(1, 10),
      credit: parseFloat(item.user_saldo || 0),
      bank_account_name: item.user_account_name,
      bank_account_number: item.user_account_number,
      referal_code: item.user_referral,
    }))),
  ]),

  down: async (queryInterface) => Promise.all([
    queryInterface.bulkDelete(sellerTable, null, { truncate: true }),
    queryInterface.bulkDelete(sellerDetailTable, null, { truncate: true }),
  ]),
};
