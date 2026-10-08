//backend/middleware/protectCustomer.js
import Customer from '../models/Customer.js';
import customerAdminFire from '../config/firebaseAdmin.js';
import logger from '../utils/logger.js';
import { safeErrorMeta } from '../utils/safeError.js';

const protectCustomer = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    // Only a Firebase rejection is a 401. Expired tokens are routine, so log
    // the code only, not the full error and stack.
    let decoded;
    try {
      decoded = await customerAdminFire.auth().verifyIdToken(token);
    } catch (err) {
      logger.warn("Customer token rejected", { code: err.code });
      return res.status(401).json({ message: "Invalid token" });
    }

    const customer = await Customer.findOne({ firebaseUid: decoded.uid });

    if (!customer) {
      return res.status(401).json({ message: "Customer not found" });
    }

    // Firebase marks the account verified the moment the user clicks the
    // emailed link, but that only lives on Firebase's servers until we copy
    // it over. Sync it here (not just at login) so the badge flips on the
    // very next request instead of requiring a logout/login. Only write on
    // the false -> true transition, so this isn't a DB write on every request.
    if (decoded.email_verified === true && !customer.emailVerified) {
      customer.emailVerified = true;
      await customer.save();
    }

    req.customer = customer;
    next();
  } catch (err) {
    // The token was valid but the DB lookup failed: a server problem, not a
    // login problem, so don't tell the client its token is bad.
    logger.error("protectCustomer error", safeErrorMeta(err));
    res.status(500).json({ message: "Server error" });
  }
};


export default protectCustomer;
