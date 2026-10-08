//controllers/authController.js
// import express from 'express'; 
// const router = express.Router();
 
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import protect from '../middleware/protect.js';
import asyncHandler from 'express-async-handler';
import { randomUUID } from 'crypto';

// Must be identical between the cookie set on login and the cookie cleared on
// logout — a mismatch (e.g. SameSite=None without Secure) makes the browser
// silently drop the clearCookie's Set-Cookie header, so logout stops working.
const isProd = process.env.NODE_ENV === 'production';
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,           // HTTPS only in prod; SameSite=None below requires this be true whenever sameSite is 'none'
  sameSite: isProd ? 'none' : 'lax', // 'none' needed cross-site in prod; 'lax' works over plain HTTP in local dev
};

// Compared against when the username doesn't exist, so unknown and real
// usernames both pay the bcrypt cost and take the same time (no username
// enumeration via response timing). Cost must match User.js. Built from a
// random value at startup, so no password can ever match it.
const DUMMY_HASH = bcrypt.hashSync(randomUUID(), 12);

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
    
  // Non-string values (objects, numbers) become '' and get a 400 below,
  // instead of crashing .trim() into a 500 or reaching the Mongo query.
  const rawUsername = req.body?.username;
  const rawPassword = req.body?.password;
  const username = typeof rawUsername === 'string' ? rawUsername.trim().toLowerCase().slice(0, 50) : '';
  const password = typeof rawPassword === 'string' ? rawPassword.trim().slice(0, 128) : '';

  if (!username || !password) {
    res.status(400);
    throw new Error('Username and password are required');
  }

  const user = await User.findOne({ username });
  const isMatch = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !isMatch) {
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