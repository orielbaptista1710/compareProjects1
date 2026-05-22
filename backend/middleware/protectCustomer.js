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

    req.customer = customer;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};


export default protectCustomer;
