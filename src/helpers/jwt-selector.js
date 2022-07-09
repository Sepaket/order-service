const jwt = require('jsonwebtoken');

const jwtSelector = ({ request }) => new Promise((resolve, reject) => {
  try {
    const { authorization } = request.headers;
    const token = authorization
      .replace(/bearer/gi, '')
      .replace(/ /g, '');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    resolve(decoded);
  } catch (error) {
    reject(error);
  }
});

module.exports = jwtSelector;
