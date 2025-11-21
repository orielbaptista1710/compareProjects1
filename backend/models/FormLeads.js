import mongoose from "mongoose";

const formleadSchema = new mongoose.Schema(
  {
    //  Source Info
    source: { type: String, enum: ["homepage", "smart", "propertyPage"], required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", default: null },// if source is propertyPage  CHECK THIS AGAIN MAN


    //  User Details
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    countryCode: { type: String, default: "+91" }, //wherer DO I ADD THIS MAN

    //  User Intent
    userType: { type: String, enum: ["buyer", "investor"], default: "buyer" },
    budget: { type: String },
    propertyType: { type: String },
    locality: { type: String },
    city: { type: String },
    requirements: { type: String },
    message: { type: String },
    loanInterest: { type: Boolean, default: false },

    //  Status (for CRM use)
    status: {
      type: String,
      enum: ['new', 'contacted', 'interested', 'not_interested', 'converted', 'stale'],
      default: "new",
    },
    lastContacted: { type: Date, default: Date.now },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Sales team member

    pushedToCRM: { type: Boolean, default: false }, // Flag to indicate if the lead has been pushed to CRM

    //  Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("FormLead", formleadSchema);
