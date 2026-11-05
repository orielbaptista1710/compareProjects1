// models/Customer.js
import mongoose from 'mongoose';
import validator from 'validator';
import { AGENT_STATUS } from '../constants/roles.js';

const customerSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  customerName: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
  },
  customerEmail: {
    type: String,
    unique: true,
    sparse: true,          // ← allows multiple null values
    lowercase: true,
    validate: {
      validator: (v) => !v || validator.isEmail(v),
      message: 'Invalid email address',
    },
  },
  customerPhone: { 
    type: String,
    unique: true,
    sparse: true,          // ← allows multiple null values
    validate: {
      validator: (v) => !v || validator.isMobilePhone(v, 'any'),
      message: 'Invalid phone number',
    },
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  heartProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  compareProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property"}],

  // false = suspended by an admin: protectCustomer refuses every request.
  isActive: { type: Boolean, default: true },

  // Every customer can post their own property (listedBy 'owner'). Applying as
  // an agent and being approved by an admin makes their new listings 'agent'.
  agent: {
    status: {
      type: String,
      enum: Object.values(AGENT_STATUS),
      default: AGENT_STATUS.NONE,
    },
    agencyName: { type: String, trim: true, maxlength: 150 },
    reraAgentId: { type: String, trim: true, maxlength: 100 },
    appliedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
  },

}, { timestamps: true });

// Admin "agent applications" queue.
customerSchema.index({ 'agent.status': 1, 'agent.appliedAt': 1 });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;