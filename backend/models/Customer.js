// models/Customer.js
import mongoose from 'mongoose';
import validator from 'validator';

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
  heartProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  compareProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property"}],

}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;