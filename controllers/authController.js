const User       = require('../models/userModel');
const bcrypt     = require('bcrypt');
const jwt        = require('jsonwebtoken');
const dotenv     = require('dotenv');
const crypto     = require('crypto');
const nodemailer = require('nodemailer');

dotenv.config();

const otpStore = {};


const transporter = nodemailer.createTransport({
  host   : 'smtp.gmail.com',
  port   : 587, 
  secure : false, 
  auth   : {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


const mailOptions = {
  from    : process.env.EMAIL_USER,
  to      : 'test@example.com',
  subject : 'Testing Nodemailer',
  text    : 'Hello! This is a test email.'
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Email sent:', info.response);
  }
});


const generateOTP = () => {
  return crypto.randomBytes(3).toString('hex');
};


const sendOTP = async (email, otp) => {
  const mailOptions = {
    from     : process.env.EMAIL_USER,
    to       : email,
    subject  : 'Password Reset OTP',
    text     : `Your OTP for password reset is: ${otp}`,
  };
  await transporter.sendMail(mailOptions);
};


exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = new User({ email, password });
    await user.save();
    res.status(201).json({ status: true, message: 'User created successfully' });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
};


exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ status: true, token });
  } catch (err) {
    res.status(500).json({ status: false, message: 'Server error' });
  }
};


exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    const otp = generateOTP();
    otpStore[email] = otp;  

    await sendOTP(email, otp);

    res.json({ status: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Error in forgetPassword:', err); 
    res.status(500).json({ status: false, message: 'Server error' });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (otpStore[email] !== otp) {
      return res.status(400).json({ status: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10); 
    await user.save();

    delete otpStore[email];

    res.json({ status: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: 'Server error' });
  }
};
