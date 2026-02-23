//this is used for the developer to reset their password

// routes/devResetPwdRoutes.js ---- CHECK THIS 
const express = require('express');
const router = express.Router();
const User = require('../models/User');
// const PasswordResetLog = require('../models/DevPasswordResetLog');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/developer-forgot-password', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ username, role: 'user' });
    if (!user) return res.status(404).json({ message: 'Developer not found' });

    const tempPassword = crypto.randomBytes(4).toString('hex');
    user.password = tempPassword;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your New Developer Password',
      text: `Hello ${user.displayName},\n\nYour new password: ${tempPassword}`
    });

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending email' });
  }
});


module.exports = router;
