// routes/customerRoutes.js
//login and signup api for customers 
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
  console.log("Signup body:", req.body); 
  try {
    const { customerName, customerEmail, customerPhone, customerPassword  } = req.body;
    if (!customerName || !customerEmail || !customerPhone || !customerPassword ) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const customerEmailLower = customerEmail.toLowerCase();
    const exists = await Customer.findOne({ $or: [{ customerEmail: customerEmailLower }, { customerPhone }] });
    if (exists) return res.status(400).json({ message: 'Email or phone already registered' });

    const customer = await Customer.create({ customerName, customerEmail, customerPhone, customerPassword  });
    const token = createToken(customer._id);

    res.status(201).json({
      token,
      customer: {
        _id: customer._id,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        customerPhone: customer.customerPhone,
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
    const { emailOrPhone, customerPassword  } = req.body;
    if (!emailOrPhone || !customerPassword ) return res.status(400).json({ message: 'Missing credentials' });

    const customer = await Customer.findOne({
      $or: [{ customerEmail: emailOrPhone.toLowerCase() }, { customerPhone: emailOrPhone }],
    });
    if (!customer) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await customer.comparePassword(customerPassword );
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = createToken(customer._id);
    res.json({
      token,
      customer: {
        _id: customer._id,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        customerPhone: customer.customerPhone,
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
        customerName: c.customerName,
        customerEmail: c.customerEmail,
        customerPhone: c.customerPhone,
      },
    });
  } catch (err) {
    console.error('Customer /me error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
