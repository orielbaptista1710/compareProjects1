// routes/customerRoutes.js
import express from 'express';
const router = express.Router();

import rateLimit from 'express-rate-limit';
import Customer from '../models/Customer.js';
import protectCustomer from '../middleware/protectCustomer.js';
import customerAdminFire from '../config/firebaseAdmin.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, slow down' },
});

// ─── SIGNUP ──────────────────────────────────────────────────
router.post('/firebase-signup', authLimiter, async (req, res) => {
  try {
    const { token, customerName, customerPhone } = req.body;

    if (!token || !customerName) {
      return res.status(400).json({ message: 'Token and name are required' });
    }

    // Verify Firebase token server-side — cannot be faked
    const decoded = await customerAdminFire.auth().verifyIdToken(token);

    // Phone priority: form input > Firebase token (form is more reliable for email signups)
    const resolvedPhone = customerPhone?.trim() || decoded.phone_number || undefined;

    const updateData = {
      firebaseUid: decoded.uid,
      customerName: customerName.trim(),
      // only set these if they exist in the token
      ...(decoded.email && { customerEmail: decoded.email }),
      ...(resolvedPhone && { customerPhone: resolvedPhone })
    };

    // upsert = create if not exists, update if exists — no race condition
    const customer = await Customer.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      { $set: updateData },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ customer });

  } catch (err) {
    console.error('firebase-signup error:', err);

    if (err.code === 'auth/argument-error' || err.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Invalid or expired Firebase token' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const friendlyField = field === 'customerEmail' ? 'Email'
                          : field === 'customerPhone' ? 'Phone number'
                          : field;
      return res.status(400).json({ message: `${friendlyField} is already registered.` });
    }

    res.status(500).json({ message: 'Server error' });
  }
});




// ─── LOGIN ───────────────────────────────────────────────────
router.post('/firebase-login', authLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const decoded = await customerAdminFire.auth().verifyIdToken(token);

    //  Upsert — if customer doesn't exist, create a minimal record
    // This handles: manual Firebase users, signup-cleanup edge cases
    const customer = await Customer.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      {
        $setOnInsert: {                          // only set these on creation
          firebaseUid: decoded.uid,
          customerName: decoded.name || decoded.email?.split('@')[0] || 'Customer',
          ...(decoded.email        && { customerEmail: decoded.email }),
          ...(decoded.phone_number && { customerPhone: decoded.phone_number }),
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ customer });

  } catch (err) {
    console.error('firebase-login error:', err);
    if (err.code === 'auth/argument-error' || err.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Invalid or expired Firebase token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ME (protected) ──────────────────────────────────────────
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

export default router;