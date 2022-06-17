const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  user: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD,
  prefix: process.env.REDIS_PREFIX,
  legacyMode: true,
});

client.connect();
// eslint-disable-next-line no-console
client.on('connect', () => console.log('Connected to Redis!'));
// eslint-disable-next-line no-console
client.on('error', (err) => console.log('Redis Client Error', err));

const setRedisData = (payload) => {
  const {
    db = 0,
    key = '',
    data = null,
    timeout = 3600000, // in milisecond
  } = payload;

  client.select(db, () => client.setex(key, timeout, data));
};

const getRedisData = ({ db = 0, key = '' }) => new Promise((resolve, reject) => {
  client.select(db, (err) => {
    if (err) return reject(err);
    return client.get(key, (error, data) => {
      if (err) reject(error);
      else resolve(data);
    });
  });
});

const deleteRedisData = ({ db = 0, key = '' }) => {
  client.select(db, () => client.del(key || '-'));
};

module.exports = {
  setRedisData,
  getRedisData,
  deleteRedisData,
};
