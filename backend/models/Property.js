const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },

  featured: { type: Boolean, default: false }, 
  
  sourceUrl: { type: String },

  // Contact Information
  developerName : { type: String, required: true},

  // Property Information
  title: { type: String, required: true },
  description: { type: String, required: true },
  long_description: { type: String },

  brochure: { type: String },
  mapLink: { type: String },

  // Location Details
  state: { type: String, required: true },
  city: { type: String, required: true},
  locality: { type: String, required: true },
  address: { type: String, required: true },
  pincode: { type: Number, required: true },
  landmarks: {
  type: [
    {
      name: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  ],
  default: []
},
  availableFrom: {
    type: Date,
  },

  area: {
    value: { type: Number, min: 0 },
    unit: { 
      type: String, 
      enum: ['sqft', 'sqmts','guntas', 'hectares', 'acres'],
      default: 'sqft'
    }
  },

  reraApproved: { type: Boolean, default: false },
  reraNumber: { type: String , required: false },

  priceNegotiable: { type: Boolean, default: false },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: 0
  },

  propertyGroup: { 
    type: String,
    enum: ["Residential", "Commercial"],
  },

  propertyType: {
    type: String,
    required: true,
    enum:["Flats/Apartments", "Villa",
       "Plot","Shop/Showroom","Industrial Warehouse",
       "Retail", "Office Space"]
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
  floor: { type: String  },
  wing: String,

  unitsAvailable : { type: Number },
  
  amenities: { type: [String] },
  facilities: { type: [String] },
  security: { type: [String] },

  coverImage: {
    type: String,
    default: ''
  },
  galleryImages: {
    type: [String],
    default: []
  },

  //  floorplanImages: {
  //   type: [String],
  //   default: []
  // },


  floorPlans: [{
  type: { 
    type: String, 
    enum: ['2D', '3D', 'Structural'] 
  },
  imageUrl: String,
  unitType: String, 
  floorArea: {
    builtUp: Number,
    carpet: Number,
    terrace: Number
  },
  rooms: [{
    name: String, 
    dimensions: String, 
    windowCount: Number
  }]
}],

  mediaFiles: [{
    type: { type: String, enum: ['image', 'video'] },
    src: String
  }],
  virtualTours: [{
  type: { type: String, enum: ['3d', 'video', 'panorama'] },
  url: String,
  thumbnail: String
}],

  // Timestamps
  submittedAt: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String,

  viewCount: {
  type: Number,
  default: 0,
  min: 0
}

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware to set propertyGroup automatically
propertySchema.pre('save', function(next) {
  const residentialTypes = ["Flats/Apartments", "Villa", "Plot"];
  this.propertyGroup = residentialTypes.includes(this.propertyType) 
    ? "Residential" 
    : "Commercial";
  next();
});
 
propertySchema.virtual('pricePerSqft').get(function() {
  if (!this.price || !this.area || !this.area.value) return null;
  
  // Convert all areas to sqft for consistent calculation
  let areaInSqft = this.area.value;
  
  if (this.area.unit === 'sqmts') {
    areaInSqft = this.area.value * 10.764;
  } else if (this.area.unit === 'acres') {
    areaInSqft = this.area.value * 43560;
  } else if (this.area.unit === 'guntas') {
    areaInSqft = this.area.value * 1089;
  } else if (this.area.unit === 'hectares') {
    areaInSqft = this.area.value * 107639;
  }
  
  // Prevent division by zero
  if (areaInSqft <= 0) return null;
  
  return Math.round(this.price / areaInSqft);
});

// Ensure virtual fields are included when converting to JSON
propertySchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive or unnecessary fields if needed
    delete ret.__v;
    delete ret.updatedAt;
    return ret;
  }
});

propertySchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive or unnecessary fields if needed
    delete ret.__v;
    delete ret.updatedAt;
    return ret;
  }
});

propertySchema.index({ price: 1, propertyType: 1 });
propertySchema.index({ createdAt: -1 }); // For recent listings
propertySchema.index({ featured: 1, status: 1 }); // For featured properties
propertySchema.index({ userId: 1, status: 1 }); // For user's properties

module.exports = mongoose.model('Property', propertySchema);