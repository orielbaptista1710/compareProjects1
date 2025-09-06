// backend/utils/generateToken.js
const jwt = require('jsonwebtoken');

module.exports = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, 
    { expiresIn: '1h' });
};
