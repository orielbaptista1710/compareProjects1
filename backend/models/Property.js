const mongoose = require('mongoose');
const { RESIDENTIAL_TYPES, COMMERCIAL_TYPES } = require("../models/propertyType");
const slugify = require("slugify");

const propertySchema = new mongoose.Schema({

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },

  featured: { type: Boolean, default: false }, 
  
  sourceUrl: { type: String },// original source if scraped/imported
  tierType: { type: String, enum: ['tier1', 'tier2'] }, 

  // Contact Information
  developerName : { type: String, required: true},
  developerAvatar: {
    url: { type: String, default: null },
    thumbnail: { type: String, default: null },
},
  // Property Information
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true},
  long_description: { type: String },

  // Location Details
  state: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true},
  locality: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true},
  pincode: { type: Number, required: true },

  mapLink: { type: String },

//add this in the Dashboard.js?
//mapping, search, and distance filters.
coordinates: {
  lat: { type: Number },
  lng: { type: Number }
},

  //secondary locations- fix this
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
  emiStarts: { type: Number, min: 0 }, //ask danny about this 

  propertyGroup: { 
    type: String,
    enum: ["Residential", "Commercial"],
  },
  propertyType: {
  type: String,
  required: true,
  enum: [...RESIDENTIAL_TYPES, ...COMMERCIAL_TYPES]
},

  furnishing: { 
    type: String,
    enum: ['Furnished', 'Semi Furnished', 'Unfurnished', 'Fully Furnished'] 
  },
  possessionStatus: { 
    type: String,         /////////////////enum has to be added 
  },

  bhk: { type: Number },
  bathrooms: { type: Number },
  facing: { type: String },
  balconies: { type: Number },
  parkings: { type: String },

  ageOfProperty: { 
    type: String,
    // enum: ["New","5 months", "1-5 years", "5-10 years", "10+ years"],
    default: "New"
  },
  totalFloors: { type: Number },
  floor: { type: String  },
  wing: { type: String  },

  unitsAvailable : { type: Number },
  
  amenities: { type: [String] ,default: []},
  facilities: { type: [String], default: [] },
  security: { type: [String], default: [] },

  // Media (optimized)
  coverImage: {
    url: String,       // CDN URL
    thumbnail: String  // CDN thumbnail for list view
  },
  galleryImages: {
  type: [{
    url: String,
    thumbnail: String,
    caption: String
  }],
  default: []
}
,
  floorPlans: {
  type: [{
    planType: { type: String, enum: ['2D', '3D', 'Structural'] },
    imageUrl: String,
    unitType: String,
    builtUpArea: Number,
    carpetArea: Number,
    terraceArea: Number,
    rooms: [{
      name: String,
      dimensions: String,
      windowCount: Number
    }]
  }],
  default: []
},
  mediaFiles: {
  type: [{
    type: { type: String, enum: ['image','video'] },
    src: String,
    thumbnail: String
  }],
  default: []
},
  virtualTours: {
  type: [{
    type: { type: String, enum: ['3d','video','panorama'] },
    url: String,
    thumbnail: String
  }],
  default: []
},
  brochure: { type: String },


  // Review- metadata for auditing and revalidate scraped data
  dataSource: { type: String, enum: ['manual', 'scraper', 'developer'], default: 'manual' },
  importedAt: { type: Date }, 

  metadata: {
    
  //SEO and marketing metadata
    seo: {
      metaTitle: String,
      metaDescription: String,
      slug: {type: String,unique: true, trim: true},  ///should i add slug inside or outsie metadata confirm !!!!!!!
      tags: [String], //Recommendations tags for search engine
    },
    marketing: {
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    leadSource: String
  },
  moderation: {
    dataQualityScore: { type: Number, default: 0 },
    verifiedByAdmin: { type: Boolean, default: false },
    verificationNotes: String
  },
  // Stats
  analytics: {
    viewCount: { type: Number, default: 0, min: 0 },
    popularityScore: { type: Number, default: 0 }
  }

  },



  // Timestamps
  submittedAt: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String,

  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware to set propertyGroup automatically
propertySchema.pre('save', function(next) {
  this.propertyGroup = RESIDENTIAL_TYPES.includes(this.propertyType)
    ? "Residential"
    : "Commercial";
  next();
});
////this needs to be checked again-- also single hook?
propertySchema.pre("save", async function (next) {
  if (!this.isModified("title")) return next();

  const baseSlug = slugify(this.title, {
    lower: true,
    strict: true,
    trim: true
  });

  let slug = baseSlug;
  let count = 1;

  // Use this.constructor instead of Property
  while (await this.constructor.exists({ slug })) {
    slug = `${baseSlug}-${count++}`;
  }

  this.slug = slug;
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
propertySchema.index({ slug: 1 }, { unique: true, sparse: true }); // For SEO and URL  --  check what sparse means
propertySchema.index({ createdAt: -1 }); // For recent listings
propertySchema.index({ featured: 1, status: 1 }); // For featured properties
propertySchema.index({ userId: 1, status: 1 }); // For user's properties

 // For full-text search- 
propertySchema.index(
  {
    title: 'text',
    description: 'text',
    long_description: 'text',
    city: 'text',
    locality: 'text',
    state: 'text',
  },
  {
    weights: {
      title: 10,
      city: 5,
      locality: 5,
      description: 2,
      long_description: 1
    },
    name: 'PropertyTextIndex'
  }
);


module.exports = mongoose.model('Property', propertySchema);