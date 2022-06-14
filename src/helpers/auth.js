const jwt = require('jsonwebtoken');
const { Seller } = require('../app/models');

function decode(request) {
  const { headers } = request;

  const authorizationHeader = headers.authorization;
  const token = authorizationHeader
    .replace(/bearer/gi, '')
    .replace(/ /g, '');

  return jwt.verify(token, process.env.JWT_SECRET || 'secret');
}

const seller = async (request) => {
  const decoded = decode(request);
  const sellerData = await Seller.findOne({
    where: { id: decoded.id },
  });

  return sellerData;
};

const sellerId = (request) => {
  const decoded = decode(request);
  return decoded.id;
};

module.exports = {
  seller,
  sellerId,
};
