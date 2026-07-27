const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendEmail(to, subject, text) {
  if (!process.env.EMAIL_HOST) {
    console.log('Email not configured. Message:', { to, subject, text });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to, subject, text
  });
}

async function sendSMS(to, body) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log('SMS not configured. Would send to:', to, 'body:', body);
    return;
  }
  // Implement Twilio send if needed
}

module.exports = { sendEmail, sendSMS };
