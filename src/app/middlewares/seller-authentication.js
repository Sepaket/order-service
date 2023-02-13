const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');
const { getRedisData } = require('../../helpers/redis');
const { Seller } = require('../models');

module.exports = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader?.toLowerCase()?.startsWith('bearer ')) {
    return next(httpErrors.Unauthorized('Missing or wrong Authorization request header'));
  }
  const token = authorizationHeader?.replace(/bearer/gi, '')?.replace(/ /g, '') || '';

  try {
    console.log('REDIS SELLER AUTHENTICATION')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const seller = await Seller.findOne({ where: { id: decoded.id } });
    const valid = await getRedisData({ db: 0, key: `token-${seller?.email}` });

    if (valid) return next();
    return next(httpErrors(401, 'Your token was expired'));
  } catch (error) {
    return next(httpErrors.Unauthorized(error.message || error));
  }
};
