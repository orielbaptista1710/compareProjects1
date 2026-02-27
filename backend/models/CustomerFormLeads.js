// // models/CustomerLead.js

// import mongoose from "mongoose";

// const customerLeadSchema = new mongoose.Schema(
//   {

//     customerName: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     customerEmail: {
//       type: String,
//       required: true,
//       lowercase: true,
//       trim: true,
//     },

//     customerPhone: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     source: {
//       type: String,
//       required: true,
//       enum: [
//         "home_page_contact",
//         "property_page_contact",
//         "smart_properies_page_form",
//       ],
//     },

//     //    PROPERTY CONTEXT (Optional)

//     propertyId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Property",
//       default: null,
//     },

//     propertyTitle: {
//       type: String,
//       default: null,
//     },

//     //    SEARCH / PREFERENCE DATA

//     userType: { type: String, enum: ["buyer", "investor"], default: "buyer" },  //this is just for home_page_contact
//     budget: String,
//     propertyType: String,
//     locality: String,
//     city: String,
//     userType: String,
//     message: String,

//     loanInterest: {
//       type: Boolean,
//       default: false,
//     },

//     customerContactConsent: {
//       type: Boolean,
//       default: true,
//     },

//     //    TRACKING

//     pageUrl: String,
//     ipAddress: String,
//     userAgent: String,

//     //    CRM STATUS
    
//     status: {
//       type: String,
//       enum: ["new", "contacted", 'interested', 'not_interested', "qualified", "closed"],
//       default: "new",
//     },
//   },
//   { timestamps: true }
// );

// //FORM LEADS MITIAGATION TO A CRM OR EXCEL SHEET(ATLEST FOR THE FIRST FEW MONTHS)

// //    INDEXES (Important)

// // Helps detect repeat leads
// customerLeadSchema.index({ customerEmail: 1 });
// customerLeadSchema.index({ customerPhone: 1 });
// customerLeadSchema.index({ createdAt: -1 });
// customerLeadSchema.index({ source: 1 });

// export default mongoose.model("CustomerLead", customerLeadSchema);


//---------------------------------------

// // PHASE 1 (Now)
// // One CustomerLead model
// // One endpoint
// // Zod validation
// // Rate limiting
// // Track source
// // Store IP + userAgent

// // PHASE 2 (Later)
// // Admin leads dashboard
// // Lead status updates
// // Assign to sales reps
// // Export CSV
// // Duplicate detection logic

// // PHASE 3 (Future SaaS Level)
// // Lead scoring
// // Auto-email responder
// // Developer auto-notification
// // CRM integration
// // UTM campaign tracking









