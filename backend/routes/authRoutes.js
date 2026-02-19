//routes/authRoutes.js
const express = require('express'); 
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const protect = require('../middleware/protect');
const asyncHandler = require('express-async-handler');

// Get logged-in user info
router.get('/me', protect, asyncHandler(async (req, res) => {
  // req.user is already set by protect middleware
  res.json({
    success: true,
    user: {
      displayName: req.user.displayName,
      username: req.user.username,
      role: req.user.role
    }
  });
}));

// Login route
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error('Username and password are required');
  }

  console.log('Searching for user: ', username);
  const user = await User.findOne({ username });
  console.log('User found: ', user);
  console.log(`Username length: ${username.length}`);
  if (!user) {
    res.status(400);
    throw new Error('User not found: Invalid credentials');
  }
  console.log(user.password, user.username)          //REMOVE THIS
  console.log(`Password length: ${password.length}`);//REMOVE THIS 


  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error('Password mismatch: Invalid credentials');
  }

  // Create JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role }, 
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Send JWT as HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    // required for cross-site cookie
    secure: true,                //secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: "none",              //sameSite: 'strict', Lax??? prevents sending cookies cross-site
    maxAge: 60 * 60 * 1000 // 1 hour
  });

  const userData = {
    _id: user._id,
    displayName: user.displayName,
    username: user.username,
    role: user.role
  };

  res.json({ user: userData });
}));

// make changes here during production
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: "none",
    sameSite: 'Lax'
  });
  res.json({ message: 'Logged out successfully' });
});


module.exports = router;
