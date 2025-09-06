const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

const protectCustomer = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_CUSTOMER || process.env.JWT_SECRET);
    req.customer = await Customer.findById(decoded.customerId).select('-password');
    if (!req.customer) return res.status(401).json({ message: 'Customer not found' });
    next();
  } catch (err) {
    console.error('Customer protect error', err);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = protectCustomer;
