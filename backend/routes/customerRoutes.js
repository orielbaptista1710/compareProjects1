// routes/customerRoutes.js
import express from 'express';
const router = express.Router();

import Customer from '../models/Customer.js';
import protectCustomer from '../middleware/protectCustomer.js';
import customerAdminFire from '../config/firebaseAdmin.js';
import { customerAuthLimiter, customerActionLimiter } from '../middleware/rateLimiters.js';
import logger from '../utils/logger.js';
import { safeErrorMeta } from '../utils/safeError.js';
import { agentApplicationSchema } from '../validators/agentApplicationValidator.js';
import { customerSignupSchema } from '../validators/customerSignupValidator.js';
import { AGENT_STATUS } from '../constants/roles.js';

// Any Firebase token problem (expired, revoked, malformed, wrong project) is the
// client's to fix by signing in again — a 401, not a 500. Mongo errors also have
// a .code, but it's a number (e.g. 11000), so check the type first.
const isFirebaseAuthError = (err) =>
  typeof err.code === 'string' && err.code.startsWith('auth/');

// ─── SIGNUP ──────────────────────────────────────────────────
// /agent-signup sends agentApplication too. Agent status can only be set here,
// on a brand-new account — an existing customer can never turn into an agent.
router.post('/firebase-signup', customerAuthLimiter, async (req, res) => {
  try {
    const { token, agentApplication } = req.body;

    const profile = customerSignupSchema.safeParse(req.body);
    if (typeof token !== 'string' || !token || !profile.success) {
      return res.status(400).json({ message: 'Token and name are required' });
    }
    const { customerName, customerPhone } = profile.data;

    let application;
    if (agentApplication !== undefined) {
      const parsed = agentApplicationSchema.safeParse(agentApplication);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Please enter your agency name and RERA agent registration number.' });
      }
      application = parsed.data;
    }

    // Verify Firebase token server-side — cannot be faked. checkRevoked: these
    // two routes (signup, login) are the only ones that create a Customer, so a
    // token from a deleted or signed-out-everywhere account can't recreate it.
    // Other routes skip the extra Firebase call: no Customer record → 401.
    const decoded = await customerAdminFire.auth().verifyIdToken(token, true);

    const existing = await Customer.findOne({ firebaseUid: decoded.uid }).select('isActive').lean();
    // Same rule as login and protectCustomer: a suspended account can't update
    // its profile through signup either.
    if (existing?.isActive === false) {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
    }
    if (application && existing) {
      return res.status(409).json({
        message: 'This account already exists as a customer account. Use a different email to sign up as an agent.',
      });
    }

    // Phone priority: form input > Firebase token (form is more reliable for email signups)
    const resolvedPhone = customerPhone?.trim() || decoded.phone_number || undefined;

    const updateData = {
      firebaseUid: decoded.uid,
      customerName: customerName.trim(),
      emailVerified: decoded.email_verified === true,
      // only set these if they exist in the token
      ...(decoded.email && { customerEmail: decoded.email }),
      ...(resolvedPhone && { customerPhone: resolvedPhone })
    };

    // upsert = create if not exists, update if exists — no race condition.
    // $setOnInsert: the agent application only ever lands on a new record.
    const customer = await Customer.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      {
        $set: updateData,
        ...(application && {
          $setOnInsert: {
            'agent.status': AGENT_STATUS.PENDING,
            'agent.agencyName': application.agencyName,
            'agent.reraAgentId': application.reraAgentId,
            'agent.appliedAt': new Date(),
          },
        }),
      },
      { upsert: true, new: true, runValidators: true }
    );

    // The exists() check above can race a concurrent plain signup for the same
    // uid; if that one created the record, $setOnInsert was skipped — say so.
    if (application && customer.agent?.status !== AGENT_STATUS.PENDING) {
      return res.status(409).json({
        message: 'This account already exists as a customer account. Use a different email to sign up as an agent.',
      });
    }

    res.status(200).json({ customer });

  } catch (err) {
    logger.error('firebase-signup error', safeErrorMeta(err));

    if (isFirebaseAuthError(err)) {
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
router.post('/firebase-login', customerAuthLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    // checkRevoked: see firebase-signup above.
    const decoded = await customerAdminFire.auth().verifyIdToken(token, true);

    //  Upsert — if customer doesn't exist, create a minimal record
    // This handles: manual Firebase users, signup-cleanup edge cases
    const customer = await Customer.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      {
        // Refreshed on every login, not just creation — verification status
        // can change after signup (user clicks the email link later).
        $set: { emailVerified: decoded.email_verified === true },
        $setOnInsert: {                          // only set these on creation
          firebaseUid: decoded.uid,
          customerName: decoded.name || decoded.email?.split('@')[0] || 'Customer',
          ...(decoded.email        && { customerEmail: decoded.email }),
          ...(decoded.phone_number && { customerPhone: decoded.phone_number }),
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Same rule as protectCustomer — refuse here too, so the login page can
    // tell a suspended customer why instead of bouncing them back to login.
    if (customer.isActive === false) {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
    }

    res.json({ customer });

  } catch (err) {
    logger.error('firebase-login error', safeErrorMeta(err));
    if (isFirebaseAuthError(err)) {
      return res.status(401).json({ message: 'Invalid or expired Firebase token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ME (protected) ──────────────────────────────────────────
router.get('/me', customerActionLimiter, protectCustomer, async (req, res) => {
  try {
    const c = req.customer;
    res.json({
      success: true,
      customer: {
        _id: c._id,
        customerName: c.customerName,
        customerEmail: c.customerEmail,
        customerPhone: c.customerPhone,
        emailVerified: c.emailVerified,
        createdAt: c.createdAt,
        isActive: c.isActive !== false,
        agent: {
          status: c.agent?.status ?? AGENT_STATUS.NONE,
          agencyName: c.agent?.agencyName,
          reraAgentId: c.agent?.reraAgentId,
          rejectionReason: c.agent?.rejectionReason,
        },
      },
    });
  } catch (err) {
    logger.error('Customer /me error', safeErrorMeta(err));
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── AGENT RE-APPLICATION (protected) ────────────────────────
// The first application is made at /agent-signup (firebase-signup above). This
// route only lets a REJECTED agent fix their details and apply again; a
// customer account (status 'none') can never become an agent.
router.post('/agent-application', customerActionLimiter, protectCustomer, async (req, res) => {
  if ((req.customer.agent?.status ?? AGENT_STATUS.NONE) === AGENT_STATUS.NONE) {
    return res.status(403).json({
      message: 'Agent applications are only for accounts created through agent signup.',
    });
  }

  const parsed = agentApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Please enter your agency name and RERA agent registration number.' });
  }

  try {
    // Status check and update in one atomic step, so a double-submit can't
    // overwrite an application that's already pending or decided.
    const customer = await Customer.findOneAndUpdate(
      {
        _id: req.customer._id,
        'agent.status': AGENT_STATUS.REJECTED,
      },
      {
        $set: {
          'agent.status': AGENT_STATUS.PENDING,
          'agent.agencyName': parsed.data.agencyName,
          'agent.reraAgentId': parsed.data.reraAgentId,
          'agent.appliedAt': new Date(),
        },
        $unset: { 'agent.rejectionReason': '' },
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(409).json({
        message: `You can't apply right now — your agent status is "${req.customer.agent?.status}".`,
      });
    }

    res.json({
      success: true,
      agent: {
        status: customer.agent.status,
        agencyName: customer.agent.agencyName,
        reraAgentId: customer.agent.reraAgentId,
      },
    });
  } catch (err) {
    logger.error('agent-application error', safeErrorMeta(err));
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;