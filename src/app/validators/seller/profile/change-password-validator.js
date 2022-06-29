const joi = require('joi');

const validator = joi.object({
  old_password: joi.string()
    .min(6)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$@!%&*?])[A-Za-z\d#$@!%&*?]{6,}$/)
    .message({
      'string.pattern.base': 'password must include low character, capital character, special character, and number,',
    })
    .required(),
  new_password: joi.string()
    .min(6)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$@!%&*?])[A-Za-z\d#$@!%&*?]{6,}$/)
    .message({
      'string.pattern.base': 'password must include low character, capital character, special character, and number,',
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
