require('dotenv').config();
const axios = require('axios');

const catcher = async (payload) => {
  try {
    await axios.post(`${process.env.TELEGRAM_URL}/sendMessage`, {
      text: `
        Something Wrong in server ${process.env.APP_ENV}  when execute *[${payload.subject}]* with background id *[${payload?.id}]* and expedition *[${payload.expedition}]*, message : ${payload?.message}`,
      chat_id: process.env.TELEGRAM_CHAT_ID,
      parse_mode: 'MARKDOWN',
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log("telegram error catcher error : " + e?.message);
  }
};

module.exports = catcher;
