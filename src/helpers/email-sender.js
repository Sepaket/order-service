require('dotenv').config();
const nodemailer = require('nodemailer');
const httpErrors = require('http-errors');
const ejs = require('ejs');
const path = require('path');

module.exports = async (payload) => new Promise(async (resolve, reject) => {
  try {
    const {
      to = '',
      subject = 'Sepaket email info',
      content = null,
      template = '',
    } = payload;

    const isCredentialReady = (
      process.env.MAIL_HOST
      || process.env.MAIL_PORT
      || process.env.MAIL_USER
      || process.env.MAIL_PASSWORD
      || process.env.MAIL_SENDER_NAME
    );

    if (!isCredentialReady) reject(httpErrors(400, 'Please Complete Your Mail Credential'));

    const transporter = await nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    // view template
    const viewTemplate = await ejs.renderFile(path.join(__dirname, `../templates/${template}`), { ...content });

    transporter.sendMail({
      from: `${process.env.MAIL_SENDER_FROM || 'Sepaket.co.id'} <${process.env.MAIL_SENDER_NAME}>`,
      to,
      subject,
      html: viewTemplate,
    }).then((info) => {
      resolve(info);
    }).catch((err) => {
      reject(err.message);
    });
  } catch (error) {
    reject(error);
  }
});
