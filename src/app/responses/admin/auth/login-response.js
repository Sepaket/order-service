const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');
const { Admin } = require('../../../models');
const { setRedisData } = require('../../../../helpers/redis');

module.exports = class {
  constructor({ request }) {
    this.admin = Admin;
    this.request = request;
    return this.process();
  }

  async process() {
    return new Promise((resolve, reject) => {
      const { email, password } = this.request.body;

      this.admin.findOne({
        where: { email },
      }).then((credential) => {
        if (!credential) return reject(httpErrors(400, 'Email not found'));

        // check password match
        return bcrypt.compare(password, credential.password).then((match) => {
          if (!match) return reject(httpErrors(400, 'Email or password does not match'));

          this.user = credential;
          this.generateToken();
          this.storeToRedis();

          return resolve({
            token: this.token,
            biodata: {
              admin_id: credential.id,
              email: credential.email,
              name: credential.name,
              phone: credential.phone,
            },
          });
        }).catch((error) => {
          reject(error);
        });
      });
    });
  }

  generateToken() {
    const token = jwt.sign(
      { id: this.user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' },
    );

    this.token = token;
  }

  storeToRedis() {
    setRedisData(
      {
        db: 2,
        key: `token-${this.user.email}`,
        timeout: 86400000,
        data: this.token,
      },
    );
  }
};
