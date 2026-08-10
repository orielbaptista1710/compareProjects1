// middleware/protect.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from 'express-async-handler';

const protect = asyncHandler(async (req, res, next) => {
  // ── 1. Extract token ──────────────────────────────────────────────────────
  // We accept it from an HTTP-only cookie (preferred — not readable by JS)
  // OR from an Authorization header as a fallback for API clients.
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    res.status(401);
    throw new Error('Not authorised — no token provided.');
  }

  // ── 2. Verify signature & expiry ──────────────────────────────────────────
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded JWT:", decoded);
    console.log("decoded.id:", decoded.id);
    console.log("Length:", decoded.id?.length);

  } catch (err) {
    res.status(401);
    const errorMessage =  err.name === 'TokenExpiredError' ? 'Not authorised — token expired.' : 'Not authorised — invalid token.';
    throw new Error(errorMessage, {cause:err});

  }

  // ── 3. Load user from DB ───────────────────────────────────────────────────
  // IMPORTANT: this makes req.user._id a real mongoose ObjectId,
  // which is what Property.find({ userId: req.user._id }) needs.
  const user = await User.findById(decoded.id).select('-password').lean();

  if (!user) {
    res.status(401);
    throw new Error('Not authorised — user account no longer exists.');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Account has been deactivated. Contact support.');
  }

  // ── 4. Attach to request ──────────────────────────────────────────────────
  // We re-attach _id as a mongoose ObjectId so downstream code can safely
  // use it in queries.  .lean() returns a plain object, so _id is already
  // a native ObjectId — no cast needed.
  req.user = user;
  next();
});

export default protect;