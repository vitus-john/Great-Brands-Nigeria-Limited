const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Send OTP
const sendOTPEmail = async (user, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Your OTP Code',
    text: `Hello ${user.firstname},\n\nYour OTP is: ${otp}\n\nIt expires in 10 minutes.`
  };
  await transporter.sendMail(mailOptions);
};

// Send Verification Email
const sendEmail = async (user, token) => {
  const verificationLink = `${process.env.BASE_URL}/verify/${encodeURIComponent(token)}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Verify Your Email',
    text: `Hello ${user.firstname},\n\nClick the link to verify:\n\n${verificationLink}`
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendEmail, sendOTPEmail };
