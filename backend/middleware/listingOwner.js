// middleware/listingOwner.js
//
// The ONE place that decides who is posting a listing and what they may do.
// Every listing create/read-mine/update/delete route runs one of these after
// its auth middleware, and the controller only ever reads req.listingOwner:
//
//   req.listingOwner = { id, model, listedBy }
//     id       — the account's _id (stored as Property.userId)
//     model    — 'User' | 'Customer' (stored as Property.ownerModel)
//     listedBy — 'developer' | 'agent' | 'owner' (stored as Property.listedBy)
//
// None of these ever come from the request body.
import { AGENT_STATUS, LISTED_BY, OWNER_MODEL } from '../constants/roles.js';

// Mongo filter matching listings owned by this account. Always match on both
// fields: a User and a Customer could in theory share an ObjectId value.
// Listings saved before ownerModel existed have none — all of them are User
// (developer) listings — so a User also matches a missing value. That keeps
// developers' dashboards working before scripts/migrateRoles.js has run.
export const ownerFilter = (owner) => ({
  userId: owner.id,
  ownerModel: owner.model === OWNER_MODEL.USER ? { $in: [OWNER_MODEL.USER, null] } : owner.model,
});

// After protect + isDeveloper (developer JWT).
export const developerListingOwner = (req, res, next) => {
  req.listingOwner = {
    id: req.user._id,
    model: OWNER_MODEL.USER,
    listedBy: LISTED_BY.DEVELOPER,
  };
  next();
};

// After protectCustomer (Firebase), which already rejects suspended accounts.
// A customer account (agent status 'none') posts as an owner; an admin-approved
// agent posts as an agent. Other agent accounts are stopped by customerCanPost.
export const customerListingOwner = (req, res, next) => {
  const isApprovedAgent = req.customer.agent?.status === AGENT_STATUS.APPROVED;
  req.listingOwner = {
    id: req.customer._id,
    model: OWNER_MODEL.CUSTOMER,
    listedBy: isApprovedAgent ? LISTED_BY.AGENT : LISTED_BY.OWNER,
  };
  next();
};

// Extra gate for customer create/update only — viewing and deleting your own
// listings always stays allowed.
export const customerCanPost = (req, res, next) => {
  if (!req.customer.emailVerified) {
    return res.status(403).json({
      message: 'Please verify your email address before posting a property.',
    });
  }
  const agentStatus = req.customer.agent?.status;
  if (agentStatus === AGENT_STATUS.SUSPENDED) {
    return res.status(403).json({
      message: 'Your agent account has been suspended. Contact support.',
    });
  }
  // Agent accounts post only once approved — never as an owner meanwhile.
  if (agentStatus === AGENT_STATUS.PENDING) {
    return res.status(403).json({
      message: 'Your agent account is awaiting approval. You can post listings once it is approved.',
    });
  }
  if (agentStatus === AGENT_STATUS.REJECTED) {
    return res.status(403).json({
      message: 'Your agent application was not approved. Update your details and re-apply from your profile.',
    });
  }
  next();
};
