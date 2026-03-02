// backend/utils/generateToken.js
import jwt from 'jsonwebtoken';

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET,
    { expiresIn: '1h' });
};

export default generateToken;