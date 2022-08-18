const joi = require('joi');

const validator = joi.object({
  old_password: joi.string()
    .min(6)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/)
    .message({
      'string.pattern.base': 'Password minimal 6 karakter, menggunakan min. 1 huruf kecil, 1 huruf kapital dan tanpa symbol',
    })
    .required(),
  new_password: joi.string()
    .min(6)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/)
    .message({
      'string.pattern.base': 'Password minimal 6 karakter, menggunakan min. 1 huruf kecil, 1 huruf kapital dan tanpa symbol',
    })
    .required(),
  password_confirmation: joi.ref('new_password'),
});

module.exports = (object) => validator.validateAsync(object, {
  errors: {
    wrap: {
      label: '',
    },
  },
});
