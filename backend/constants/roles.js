// backend/constants/roles.js
//
// Single source of truth for account roles and listing ownership values.
// Import from here instead of typing the strings, so a rename is one edit.
// The frontend mirrors these in frontend-vite/src/constants/roles.js.

// User collection (JWT cookie auth). 'user' is the legacy name for a developer
// account; it stays valid until scripts/migrateRoles.js has renamed it.
export const USER_ROLES = Object.freeze({
  DEVELOPER: 'developer',
  ADMIN: 'admin',
  LEGACY_DEVELOPER: 'user',
});

// Who posted a listing. Always set server-side from the poster's account.
export const LISTED_BY = Object.freeze({
  OWNER: 'owner',
  AGENT: 'agent',
  DEVELOPER: 'developer',
});

// Customer.agent.status: a customer becomes an agent only once approved.
export const AGENT_STATUS = Object.freeze({
  NONE: 'none',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
});

// Property.ownerModel: which collection Property.userId points to.
export const OWNER_MODEL = Object.freeze({
  USER: 'User',
  CUSTOMER: 'Customer',
});
