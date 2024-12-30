const nodemailer = require('nodemailer');
const { MAIL_FROM, MAIL_PASSWORD } = process.env;

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: MAIL_FROM,
    pass: MAIL_PASSWORD
  }
});

// Function to send an email
async function sendMail(to) {
  const mailOptions = {
    from: MAIL_FROM,
    to: to,
    subject: "Registration completed",
    text: `You have registered successfully`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.log('Error sending email: ', error);
  }
}

module.exports = sendMail;
