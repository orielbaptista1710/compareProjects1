//backend/models/Property.js
import mongoose from 'mongoose';
import { RESIDENTIAL_TYPES, COMMERCIAL_TYPES } from './propertyType.js';
import slugify from 'slugify';
import { buildProjectKey } from '../utils/projectKey.js';
import { LISTED_BY, LISTING_STATUS, OWNER_MODEL } from '../constants/roles.js';
import { PHOTO_CATEGORIES } from '../constants/media.js';
import { SQFT_PER_UNIT, AREA_TYPES } from '../constants/listingRules.js';

const propertySchema = new mongoose.Schema({

  // Who owns (and may edit) the listing. ownerModel says which collection
  // userId points to: 'User' for developers, 'Customer' for owners and agents.
  // Both are set server-side (middleware/listingOwner.js); ownership checks must
  // match on BOTH fields — see ownerFilter() there.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // A function rather than refPath so listings saved before ownerModel
    // existed (field missing in the raw doc, e.g. .lean() queries) still
    // populate as developer listings.
    ref: function () {
      return this.ownerModel || OWNER_MODEL.USER;
    },
  },
  ownerModel: {
    type: String,
    enum: Object.values(OWNER_MODEL),
    default: OWNER_MODEL.USER,
    required: true,
  },
  // 'suspended' = was approved, hidden while the posting agent is suspended
  // (services/agentAdminService.js); reinstating the agent sets it back.
  status: {
    type: String,
    enum: Object.values(LISTING_STATUS),
    default: LISTING_STATUS.PENDING
  },
 
  slug: {
    type: String,
    index: true,
    unique: true,
  },

  featured: { type: Boolean, default: false }, 
  
  //new feature added to differentiate between sale and resale properties and differnt authentication for owner, agent and developer(based on new auth system) 
  listingType: { type: String, enum: ['sale', 'resale'] }, //add rent later
  // Set server-side from the poster's account, never from the request body.
  listedBy: { type: String, enum: Object.values(LISTED_BY) },

  //new added needs to be generated from title and developerName
  projectName: { type: String, trim: true }, //used in sale and resale - NEW

  // Groups BHK variants of the same project onto one listing card. Derived
  // from developerName + projectName + locality/city by buildProjectKey() in
  // the pre('validate') hook below — null when projectName isn't set, which
  // means this listing is never grouped with anything (see propertyController
  // getAllApprovedProperties). NEVER set this directly; bulk writes
  // (insertMany) bypass hooks, so they must call buildProjectKey() themselves.
  projectKey: { type: String, default: null },

  // used in sale only
  // Required for developer listings only (owner/agent listings have no
  // developer). Older docs without listedBy are developer listings.
  developerName: {
    type: String,
    required: function () {
      return !this.listedBy || this.listedBy === LISTED_BY.DEVELOPER;
    },
  },
  developerAvatar: {
    url: { type: String, default: null },
    thumbnail: { type: String, default: null },
    },


  // Property Type
  // propertyType: { type: String, enum: [...RESIDENTIAL_TYPES, ...COMMERCIAL_TYPES], required: true },'
  //DONT USE
  // subType: { type: String }, //add enum later

  sourceUrl: { type: String },// original source if scraped/imported CHECK THIS delly delly babe
  tierType: { type: String, enum: ['tier1', 'tier2'] }, 

  // Property Information
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true},
  long_description: { type: String },

  // Location Details
  state: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true},
  locality: { type: String, required: true, trim: true },

  sub_locality: { type: String, trim: true },

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
// Not `immutable`: that made Mongoose silently drop the recomputed point when a
// saved listing's coordinates were edited (docs/review DATA-01). The
// pre('validate') hook below is what keeps geo in sync with coordinates.
geo: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
  },
  coordinates: {
    type: [Number], // [lng, lat]
    index: '2dsphere',
  }
},

  //secondary locationss- fix this
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
      enum: Object.keys(SQFT_PER_UNIT),
      default: 'sqft'
    },
    // Carpet, built-up, super built-up or plot area (FORM-07). Optional:
    // imported listings don't say. Declared as { type: { type } } because
    // `type` is also Mongoose's own key, same as geo.type below.
    type: { type: String, enum: AREA_TYPES },
  },

  //from the rera website
  reraApproved: { type: Boolean, default: false },//if data contains reraNumber or not 
  reraNumber: { type: String , required: false },
  reraDate: { type: Date }, //reraDate of Completion
  reraQR: {type: String },
  
  
  possessionStatus: { 
    type: String,
    enum: ["Ready to Move", "Under Construction", "Immediate", "New Launch", "Pre Launch", "Upcoming"],
   },
  //possessionStatus of the property depends on reraDate- classify into Immediate n UnderConstruction
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
    enum: ['Furnished', 'Semi Furnished', 'Unfurnished', 'Fully Furnished'] 
  },

  bhk: { type: Number, min: 0 },
  bathrooms: { type: Number, min: 0 },
  facing: { type: String },
  balconies: { type: Number },
  parkings: { type: [String], default: []  },

  ageOfProperty: { 
    type: String,
    default: "New"
  },

  // what do i do about this 
  totalFloors: { type: Number }, //the total no of floors in the building
  floor: { type: Number  },//the floor on which the unit is located
  floorLabel: { 
    type: String,
    enum: ["Low Floor", "Mid Floor", "High Floor"]  //should i add a  Keep as Number BUT add a computed floorLabel field
// Parse the floor text on the backend: "5th" → 5, "Ground" → 0, "Basement" → -1
// Set floorLabel ("Low Floor" / "Mid Floor" / "High Floor") from the number
   },
  //new field added u can add eg:  High Rise / Mid Rise / Low Floor dependent on floor n totalFloors


  wing: { type: String  },// the wing of the building where the unit is located eg: G / B1 / 12
  phase: { type: String },// the phase of the building where the unit is located eg: Phase 1 / Phase 2 / Phase 3 etc  //CHECK THIS 
  // The unit's tower, e.g. "A" or "T2". Was a Number, so "Tower A" couldn't be
  // saved (FORM-18); older listings' numbers are read back as text ("3").
  tower: { type: String, trim: true },
  unitsAvailable : { type: Number },
  
  amenities: { type: [String] ,default: []},
  facilities: { type: [String], default: [] },
  security: { type: [String], default: [] },

  // Media (optimized)
  coverImage: {
    url: String,       // CDN URL
    thumbnail: String, // CDN thumbnail for list view
    category: { type: String, enum: PHOTO_CATEGORIES }
  },
  galleryImages: {
  type: [{
    url: String,
    thumbnail: String,
    caption: String,
    category: { type: String, enum: PHOTO_CATEGORIES } // tab it was uploaded under; older photos have none
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
  brochure: {
  url:        { type: String },   
  public_id:  { type: String },   // e.g. "properties/brochure/my-doc"
},


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



  // When the listing was last put in front of a reviewer: when it was posted, or
  // when its poster last edited it after it had already been reviewed. The admin
  // queue sorts "oldest waiting first" on this.
  submittedAt: { type: Date, default: Date.now },

  // Set only when a poster edits a listing that was already reviewed (see
  // updateProperty). Lets an admin tell an edit from a new listing and see what
  // to re-check. Field NAMES only, taken from the input allowlist (never client
  // text), so nothing here needs sanitising. Server-only: not in the input validator.
  lastEditedAt: { type: Date },
  // +1 on every edit that changes the listing; a review must name the
  // version it saw (utils/contentVersion.js). Missing on older docs = 0.
  contentVersion: { type: Number, default: 0, min: 0 },
  changedFields: { type: [String], default: [] },
  // Random id the form sends with a new listing (FORM-11). A retry with the
  // same id (double click, timeout) gets this listing back instead of a second
  // copy. Unique per account (index below); never sent back to clients.
  submissionId: { type: String, select: false },

  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String,
  // First admin approval. From then on LOCKED_AFTER_APPROVAL fields can't be
  // edited (constants/listingRules.js). Older approved listings don't have it;
  // their status or reviewHistory says the same.
  firstApprovedAt: Date,

  // What the poster ticked when they last submitted. Times come from the
  // server, never the client; termsVersion says which wording they agreed to.
  consent: {
    termsAcceptedAt: Date,
    detailsConfirmedAt: Date,
    termsVersion: String,
  },

  // Audit trail of admin decisions, newest last, capped at 20 entries by the
  // $slice in services/propertyAdminService.js. reviewedBy/reviewedAt above
  // only hold the latest decision. Approvals made directly in MongoDB bypass
  // this — use scripts/reviewProperty.js for those so they're recorded too.
  reviewHistory: {
    type: [{
      _id: false,
      action: { type: String, enum: ['approved', 'rejected'] },
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date },
      reason: { type: String },
    }],
    default: [],
  },

   
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


  // Recompute on every validate (not just when source fields change) so a
  // historical doc re-saved for any reason picks up a projectKey once
  // projectName is backfilled, same way propertyGroup self-heals above.
  // Customer (owner/agent) listings are never grouped into project cards: an
  // owner typing a project's name must not merge their unit into the
  // developer's card. Everything User-owned groups as before (incl. scraped).
  const isCustomerListing = this.ownerModel === OWNER_MODEL.CUSTOMER;
  this.projectKey = isCustomerListing ? null : buildProjectKey(this);

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
  
  // Convert all areas to sqft for consistent calculation (shared table)
  const areaInSqft = this.area.value * (SQFT_PER_UNIT[this.area.unit] ?? 1);

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
    delete ret.submissionId; // FORM-11 retry key, server-side only
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

// BHK-variant grouping for the listing page ($group by projectKey)
propertySchema.index({
  status: 1,
  projectKey: 1,
});

// Recent properties
propertySchema.index({
  status: 1,
  createdAt: -1,
});

// Admin review queue: pending listings, oldest waiting first
propertySchema.index({
  status: 1,
  submittedAt: 1,
});

// One listing per submission per account (FORM-11). Partial: only listings
// created with a submissionId are indexed, so older ones never clash.
propertySchema.index(
  { userId: 1, ownerModel: 1, submissionId: 1 },
  { unique: true, partialFilterExpression: { submissionId: { $type: 'string' } } }
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

const Property = mongoose.model('Property', propertySchema);
export default Property;