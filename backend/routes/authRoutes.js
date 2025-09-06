// Auth Routes for Developers and Admin - No signup ONLY login
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const protect = require('../middleware/protect');


router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        displayName: req.user.displayName,
        username: req.user.username
        // Add other fields you might need
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user data'
    });
  }
});


router.post('/login', async (req, res) => {
  console.log('Login attempt received:', req.body); // Add this line
  
  const { username, password } = req.body;

  // Validate input data
  if (!username || !password) {
    console.log('Missing credentials'); // Add this
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    console.log('Looking for user:', username); // Add this
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log('User not found'); // Add this
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Comparing passwords'); // Add this
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Password mismatch'); // Add this
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    const userData = {
      _id: user._id,
      displayName: user.displayName,
      username: user.username,
      role: user.role
    };

    console.log('Login successful for:', username); // Add this
    res.json({ 
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error); // Enhanced logging
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
  


module.exports = router;
