//controllers/authController.js
// import express from 'express'; 
// const router = express.Router();
 
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import protect from '../middleware/protect.js';
import asyncHandler from 'express-async-handler';

// Must be identical between the cookie set on login and the cookie cleared on
// logout — a mismatch (e.g. SameSite=None without Secure) makes the browser
// silently drop the clearCookie's Set-Cookie header, so logout stops working.
const isProd = process.env.NODE_ENV === 'production';
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,           // HTTPS only in prod; SameSite=None below requires this be true whenever sameSite is 'none'
  sameSite: isProd ? 'none' : 'lax', // 'none' needed cross-site in prod; 'lax' works over plain HTTP in local dev
};

//Get logged in user info
export const getMe = asyncHandler(async (req, res) => {
    // req.user is already set by protect middleware
  res.json({
    success: true,
    user: {
      displayName: req.user.displayName,
      username: req.user.username,
      role: req.user.role
    }
  });
})

//Login user - developer and admin
export const login = asyncHandler(async (req, res) => {
    
  const username = req.body.username?.trim().toLowerCase().slice(0, 50);
  const password = req.body.password?.trim().slice(0, 128);

  if (!username || !password) {
    res.status(400);
    throw new Error('Username and password are required');
  }

  // console.log('Searching for user: ', username);
  const user = await User.findOne({ username }); 
  // console.log('User found: ', user);
  // console.log(`Username length: ${username.length}`);
  if (!user) {
    res.status(401); 
    throw new Error('Invalid username or password');
  }
  // console.log(user.password, user.username)          //REMOVE THIS CHECK THIS 
  // console.log(`Password length: ${password.length}`);//REMOVE THIS 

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid username or password');
  }
  if (!user.isActive) {
  res.status(403);
  throw new Error('Your account has been deactivated. Please contact admin.');
}

  // Create JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role }, 
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  // Send JWT as HTTP-only cookie
  res.cookie('token', token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 8 * 60 * 60 * 1000
  });

  const userData = {
    _id: user._id,
    displayName: user.displayName,
    username: user.username,
    role: user.role
  };

  res.json({ user: userData });
})

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', AUTH_COOKIE_OPTIONS);
  res.json({ message: 'Logged out successfully' });
})