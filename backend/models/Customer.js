const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator'); // npm install validator

const customerSchema = new mongoose.Schema({
  customerName: { 
    type: String, 
    required: [true, 'Name is required'], 
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  customerEmail: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true,
    validate: [validator.isEmail, 'Invalid email address']
  },
  customerPhone: { 
    type: String, 
    required: [true, 'Phone number is required'], 
    unique: true,
    validate: {
      validator: v => validator.isMobilePhone(v, 'any'),
      message: 'Invalid phone number'
    }
  },
  customerPassword: { 
    type: String, 
    required: [true, 'Password is required'], 
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function (value) {
        // Require 1 uppercase, 1 number, 1 special character
        return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
      },
      message:
        'Password must be at least 8 characters and include one uppercase letter, one number, and one special character.'
    }
  },
}, { timestamps: true });

// Hash password before saving
customerSchema.pre('save', async function (next) {
  if (!this.isModified('customerPassword')) return next();
  this.customerPassword = await bcrypt.hash(this.customerPassword, 10);
  next();
});

// Compare password method
customerSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.customerPassword);
};

module.exports = mongoose.model('Customer', customerSchema);
