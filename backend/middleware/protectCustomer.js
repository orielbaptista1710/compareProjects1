//backend/middleware/protectCustomer.js
// import jwt from 'jsonwebtoken'; 
import Customer from '../models/Customer.js';
import customerAdminFire from '../config/firebaseAdmin.js';

const protectCustomer = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = await customerAdminFire.auth().verifyIdToken(token);

    const customer = await Customer.findOne({ firebaseUid: decoded.uid });

    if (!customer) {
      return res.status(401).json({ message: "Customer not found" });
    }

    // Firebase marks the account verified the moment the user clicks the
    // emailed link, but that only lives on Firebase's servers until we copy
    // it over. Sync it here (not just at login) so the badge flips on the
    // very next request instead of requiring a logout/login. Only write on
    // the false -> true transition, so this isn't a DB write on every request.
    // if (false && decoded.email_verified === true && !customer.emailVerified) {

    if (decoded.email_verified === true && !customer.emailVerified) {
      customer.emailVerified = true;
      await customer.save();
    }

    req.customer = customer;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};


export default protectCustomer;
