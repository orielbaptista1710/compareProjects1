

// import mongoose from "mongoose";

// const developerLeadSchema = new mongoose.Schema(
//   {

//     developerFullName: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     developerEmail: {
//       type: String,
//       required: true,
//       lowercase: true,
//       trim: true,
//     },

//     developerPhone: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     developerContactConsent: {
//       type: Boolean,
//       required: true,
//     },

//     source: {
//       type: String,
//       enum: [
//         "developer_popup",
//       ],
//       required: true,
//     },

// //future optionsal
//     companyName: {
//       type: String,
//       default: null,
//     },

//     projectLocation: {
//       type: String,
//       default: null,
//     },

//     message: {
//       type: String,
//       default: null,
//     },

//     /* -------------------------
//        TRACKING
//     ------------------------- */
//     pageUrl: String,
//     ipAddress: String,
//     userAgent: String,

//     /* -------------------------
//        CRM STATUS
//     ------------------------- */
//     leadStatus: {
//       type: String,
//       enum: ["new", "contacted", "qualified", "rejected", "onboarded"],
//       default: "new",
//     },
//   },
//   { timestamps: true }
// );

// /* -------------------------
//    INDEXES
// ------------------------- */
// developerLeadSchema.index({
//   developerEmail: 1,
//   createdAt: -1
// });
// developerLeadSchema.index({ developerPhone: 1 });
// developerLeadSchema.index({ leadStatus: 1 });

// export default mongoose.model("DeveloperLead", developerLeadSchema);




