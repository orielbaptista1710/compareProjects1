const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },

  // Contact Information
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
  phone: { type: String },

  // Property Information
  title: { type: String, required: true },
  coverimage: { type: String },
  description: { type: String, required: true },
  long_description: { type: String },

  // Location Details
  location: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  locality: { type: String, required: true },
  address: { type: String, required: true },
  pincode: { type: Number, required: true },
  landmarks: { type: [String] },

  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  pricePerSqft: { 
    type: Number,
    min: 0
  },
  area: {
    value: { type: Number, min: 0 },
    unit: { 
      type: String, 
      enum: ['sqft', 'sqm', 'acre', 'hectare'],
      default: 'sqft'
    }
  },

   // Property details
   propertyType: { 
    type: String, 
    required: true,
    enum: ['Residential', 'Industrial', 'Retail', 'Commercial', 'Plot']
  },
  furnishing: { 
    type: [String],
    enum: ['Furnished', 'Semi Furnished', 'Unfurnished', 'Fully Furnished'] 
  },
  possessionStatus: { 
    type: [String],
    enum: [
      'Under Construction', 
      'Ready to Move',
      'Ready for Development',
      'Possession Within 3 Months',
      'Possession Within 6 Months',
      'Possession Within 1 Year',
      'Ready for Sale'
    ]
  },

  bhk: { type: String },
  bathrooms: { type: String },
  facing: { type: String },
  balconies: { type: String },
  parkings: { type: [String] },

  ageOfProperty: { 
    type: String,
    enum: ["New", "1-5 years", "5-10 years", "10+ years"],
    default: "New"
  },
  totalFloors: { type: Number },
  floor: { type: String },

  
  // Timestamps
  submittedAt: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String

}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);