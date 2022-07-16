const axios = require('axios');
const { NinjaLocation } = require('../app/models');
const { setRedisData, getRedisData } = require('./redis');

const tokenization = () => new Promise((resolve, reject) => {
  axios.post(`${process.env.NINJA_BASE_URL}/2.0/oauth/access_token`, {
    client_id: process.env.NINJA_CLIENT_ID,
    client_secret: process.env.NINJA_SECRET,
    grant_type: process.env.NINJA_GRANT_TYPE,
  }).then((response) => {
    setRedisData({
      db: 3,
      key: 'ninja-token',
      data: response?.data?.access_token,
      timeout: 300000, // 5 min
    });
    resolve(response?.data?.access_token);
  }).catch((error) => {
    reject(new Error(error?.response?.data?.message || error?.message || 'Something Wrong'));
  });
});

const localToken = async () => {
  try {
    const token = await getRedisData({ key: 'ninja-token', db: 3 });
    return token;
  } catch (error) {
    throw new Error(error?.message || 'Somethin Wrong');
  }
};

const getOrigin = () => new Promise(async (resolve, reject) => {
  try {
    const locations = NinjaLocation;
    const response = await locations.findAll();

    resolve(response);
  } catch (error) {
    reject(new Error(`Ninja: ${error?.message || 'Something Wrong'}`));
  }
});

const getDestination = () => new Promise(async (resolve, reject) => {
  try {
    const locations = NinjaLocation;
    const response = await locations.findAll();

    resolve(response);
  } catch (error) {
    reject(new Error(`Ninja: ${error?.message || 'Something Wrong'}`));
  }
});

const checkPrice = (payload) => new Promise(async (resolve) => {
  try {
    const {
      weight,
      origin,
      service,
      destination,
    } = payload;

    const originSplitted = origin.split(',');
    const destinationSplitted = destination.split(',');
    const token = await localToken() || await tokenization();
    const price = await axios.post(`${process.env.NINJA_BASE_URL}/1.0/public/price`, {
      weight,
      service_level: service,
      from: {
        l1_tier_code: originSplitted[0],
        l2_tier_code: originSplitted[1],
      },
      to: {
        l1_tier_code: destinationSplitted[0],
        l2_tier_code: destinationSplitted[1],
      },
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    resolve(price?.data?.data?.total_fee);
  } catch (error) {
    resolve(null);
  }
});

const createOrder = (payload) => new Promise(async (resolve, reject) => {
  const token = await localToken() || await tokenization();
  axios.post(`${process.env.NINJA_BASE_URL}/4.1/orders`, {
    ...payload,
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((response) => {
    resolve(response?.data);
  }).catch(async (error) => {
    reject(new Error(`NINJA: ${error?.response?.data?.error?.message || error?.message}`));
  });
});

const tracking = (payload) => new Promise(async (resolve) => {
  const { resi } = payload;
  const token = await localToken() || await tokenization();

  axios.get(`${process.env.NINJA_BASE_URL}/1.0/orders/tracking-events/${resi}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((response) => {
    resolve(response?.data);
  }).catch(async (error) => {
    resolve({ error: error?.response?.data?.error?.message || error?.message });
  });
});

const cancel = (payload) => new Promise(async (resolve, reject) => {
  const { resi } = payload;
  const token = await localToken() || await tokenization();

  axios.delete(`${process.env.NINJA_BASE_URL}/2.2/orders/${resi}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((response) => {
    resolve(response?.data);
  }).catch(async (error) => {
    reject(new Error(`NINJA: ${error?.response?.data?.data?.message || error?.message}`));
  });
});

module.exports = {
  getOrigin,
  getDestination,
  checkPrice,
  createOrder,
  tracking,
  cancel,
};
