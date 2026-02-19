
//middleware/protect.js 
const jwt = require('jsonwebtoken'); 
const User = require('../models/User');
const asyncHandler = require('express-async-handler'); 

const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      throw new Error("User not found");
    }
    next();
  } catch (error) {
    console.error("Protect middleware error:", error);

    if (error.name === 'TokenExpiredError') {
      res.status(401);
      throw new Error("Session expired, please log in again");
    }

    res.status(401);
    throw new Error("Not authorized, token failed");
  }



});

module.exports = protect;
