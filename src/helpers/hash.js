const bcrypt = require('bcrypt');

module.exports = ({ payload, length = 10 }) => new Promise((resolve, reject) => {
  bcrypt.hash(payload, length, (err, hash) => {
    if (err) reject(err);
    else resolve(hash);
  });
});
