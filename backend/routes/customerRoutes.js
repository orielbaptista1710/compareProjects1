// routes/customerRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const protectCustomer = require('../middleware/protectCustomer');

const router = express.Router();

console.log("✅ customerRoutes.js loaded");

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Customer routes working ✅' });
});



// helper to create token
const createToken = (customerId) => {
  const secret = process.env.JWT_SECRET_CUSTOMER || process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_CUSTOMER || '7d';
  return jwt.sign({ customerId }, secret, { expiresIn });
};

// Signup
router.post('/customer-signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const exists = await Customer.findOne({ $or: [{ email }, { phone }] });
    if (exists) return res.status(400).json({ message: 'Email or phone already registered' });

    const customer = await Customer.create({ name, email, phone, password });
    const token = createToken(customer._id);

    res.status(201).json({
      token,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err) {
    console.error('Customer signup error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/customer-login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) return res.status(400).json({ message: 'Missing credentials' });

    const customer = await Customer.findOne({
      $or: [{ email: emailOrPhone.toLowerCase() }, { phone: emailOrPhone }],
    });
    if (!customer) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await customer.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = createToken(customer._id);
    res.json({
      token,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err) {
    console.error('Customer login error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get me (protected)
router.get('/me', protectCustomer, async (req, res) => {
  try {
    const c = req.customer;
    res.json({
      success: true,
      customer: {
        _id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
      },
    });
  } catch (err) {
    console.error('Customer /me error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
