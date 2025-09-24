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

  const user = await User.findOne({ username });

  if (!user) {
    res.status(400);
    throw new Error('User not found: Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(400);
    throw new Error('Password mismatch: Invalid credentials');
  }

  const token = jwt.sign(
    { id: user._id, role: user.role }, 
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const userData = {
    _id: user._id,
    displayName: user.displayName,
    username: user.username,
    role: user.role
  };

  res.json({
    token,
    user: userData
  });
}));

module.exports = router;
