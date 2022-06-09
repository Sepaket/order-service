require('dotenv').config();
const nodemailer = require('nodemailer');
const httpErrors = require('http-errors');

module.exports = async (payload) => new Promise((resolve, reject) => {
  const {
    to = '',
    message = '',
    subject = 'Sepaket email info',
    // html = '<p></p>',
  } = payload;

  const isCredentialReady = (
    process.env.MAIL_HOST
    || process.env.MAIL_PORT
    || process.env.MAIL_USER
    || process.env.MAIL_PASSWORD
    || process.env.MAIL_SENDER_NAME
  );

  if (!isCredentialReady) reject(httpErrors(400, 'Please Complete Your Mail Credential'));

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  transporter.sendMail({
    from: `${process.env.MAIL_SENDER_FROM || 'Sepaket.co.id'} <${process.env.MAIL_SENDER_NAME}>`,
    to,
    subject,
    text: message,
    // html,
  }).then((info) => {
    resolve(info);
  }).catch((err) => {
    reject(err.message);
  });
});
