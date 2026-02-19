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
 
  slug: {
    type: String,
    index: true,
    unique: true,
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
  pincode: {
    type: String,
    required: true,
    trim: true,
    match: /^[0-9]{6}$/ // India-safe
  },

  mapLink: { type: String },

//add this in the Dashboard.js?
//this cooridate is the souce it is used to derive geo.cooridates
//human-friendly used for direct ui display,confidence score, used to derive geo coordinates
coordinates: {
  lat: { type: Number },
  lng: { type: Number },

  source: {
    type: String,
    enum: ['address', 'locality', 'city', 'manual'],
    default: 'address'
  },

  confidence: {
    type: String,
    enum: ['high', 'medium', 'low'],
  },

  geocodedAt: { type: Date }
},

// Note to scrapper-NEVER do Property.updateOne({ geo: ... }) directly
// Always update via coordinates


// MongoDB-native geolocation (for geo queries)
//used for queries, searching, mapping , filters 
//derived from coordinates
geo: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    immutable: true

  },
  coordinates: {
    type: [Number], // [lng, lat]
    index: '2dsphere',
    immutable: true

  }
},

  //secondary locations- fix this
  //landmarks u can keep blank for now im still working on this
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

  area: {
    value: { type: Number, min: 0 },
    unit: { 
      type: String,  
      enum: ['sqft', 'sqmts','guntas', 'hectares', 'acres'],
      default: 'sqft'
    }
  },

  //from the rera website
  reraApproved: { type: Boolean, default: false },//if data contains reraNumber or not 
  reraNumber: { type: String , required: false },
  reraDate: { type: Date }, //reraDate of Completion
  reraQR: {type: String },
  possessionStatus: { type: String },//possessionStatus of the property depends on reraDate- classify into Immediate n UnderConstruction
  //ADD ENUM TO THIS ONCE RERA IS SETTLED


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
    enum: ['Furnished', 'Semi-Furnished', 'Unfurnished', 'Fully Furnished'] 
  },

  bhk: { type: Number, min: 0 },
  bathrooms: { type: Number, min: 0 },
  facing: { type: String },
  balconies: { type: Number },
  parkings: { type: String },

  ageOfProperty: { 
    type: String,
    default: "New"
  },

  // what do i do about this 
  totalFloors: { type: Number }, //the total no of floors in the building
  floor: { type: Number  },//the floor on which the unit is located
  floorLabel: { type: String },//new field added u can add eg:  High Rise / Mid Rise / Low Floor dependent on floor n totalFloors


  wing: { type: String  },// the wing of the building where the unit is located eg: G / B1 / 12
  phase: { type: String },// the phase of the building where the unit is located eg: Phase 1 / Phase 2 / Phase 3 etc  //CHECK THIS 
  tower: { type: Number },// the tower of the building where the unit is located eg: Tower A / Tower B / Tower C etc
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
  dataSource: { type: String, enum: ['manual', 'scraper', 'developer','test'], default: 'manual' },
  importedAt: { type: Date },  //json 

  metadata: {
    
  //SEO and marketing metadata
    seo: {
      metaTitle: String,
      metaDescription: String,
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
  submittedAt: { type: Date, default: Date.now }, //this is for the time when the property is submitted by developer??
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String,

  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

//should i pre('validate') propertyGroup as well?
propertySchema.pre("validate", function (next) {
  //Normalize pincode - CHECK THIS 
  if (this.pincode !== undefined && this.pincode !== null) {
    this.pincode = String(this.pincode).trim();
  }
  
  //Trim common text fields- ie it will remove leading and trailing spaces
  const textFields = ["state", "city", "locality", "address", "developerName", "title"];
  textFields.forEach(field => {
    if (this[field]) this[field] = this[field].trim();
  });

  // Auto set propertyGroup
  // Middleware to set propertyGroup automatically
  if (RESIDENTIAL_TYPES.includes(this.propertyType)) {
  this.propertyGroup = "Residential";
} else if (COMMERCIAL_TYPES.includes(this.propertyType)) {
  this.propertyGroup = "Commercial";
} else {
  this.invalidate('propertyType', 'Unknown property type');
}


  if (this.coordinates?.lat != null && this.coordinates?.lng != null) {
  const { lat, lng } = this.coordinates;

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    this.invalidate('coordinates', 'Invalid latitude or longitude- TO BE LOGGED');
  } else {
    this.geo = {
      type: 'Point',
      coordinates: [
        this.coordinates.lng, //lng always first
        this.coordinates.lat
      ]
    };
  }
}

  next();
});


//pre('validate') runs earlier than 'save'




//CHECK THIS -- CHECK SLUG USE SLUGIFY?
propertySchema.pre("save", async function (next) {
  if (!this.isModified("title")) return next();

  const baseSlug = slugify(this.title, {
    lower: true,
    strict: true,
    trim: true
  });

  let slug = baseSlug;
  let count = 1;


  // Use this.constructor instead of Property -- CHECK THIS -- CHECK SLUG USE SLUGIFY?
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

propertySchema.index(
  { featured: 1, createdAt: -1 },
  { partialFilterExpression: { status: "approved" } }
);


// Core public search index
propertySchema.index({
  status: 1,
  city: 1,
  propertyType: 1,
  bhk: 1,
  price: 1,
});

// Featured listings
propertySchema.index({
  status: 1,
  featured: -1,
  createdAt: -1,
});

// City → locality drilldown
propertySchema.index({
  status: 1,
  city: 1,
  locality: 1,
});

// User dashboard
propertySchema.index({
  userId: 1,
  status: 1,
});

// Recent properties
propertySchema.index({
  status: 1,
  createdAt: -1,
});

// SEO slug
propertySchema.index(
  { slug: 1 },
  { unique: true }
);


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