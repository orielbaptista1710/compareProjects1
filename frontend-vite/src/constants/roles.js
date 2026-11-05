// src/constants/roles.js
//
// Mirror of backend/constants/roles.js — keep the two in sync. Import role and
// listing-ownership values from here instead of typing the strings.

export const USER_ROLES = Object.freeze({
  DEVELOPER: "developer",
  ADMIN: "admin",
  LEGACY_DEVELOPER: "user", // valid until the backend role migration has run
});

// Roles allowed into the developer dashboard (/dashboard).
export const DEVELOPER_ROLES = [USER_ROLES.DEVELOPER, USER_ROLES.LEGACY_DEVELOPER];

export const LISTED_BY = Object.freeze({
  OWNER: "owner",
  AGENT: "agent",
  DEVELOPER: "developer",
});

export const LISTED_BY_LABELS = Object.freeze({
  [LISTED_BY.OWNER]: "Owner",
  [LISTED_BY.AGENT]: "Agent",
  [LISTED_BY.DEVELOPER]: "Developer",
});

// Which account collection a listing's userId points to (Property.ownerModel).
export const OWNER_MODEL = Object.freeze({ USER: "User", CUSTOMER: "Customer" });

// Public wording for who posted a listing ("Contact Builder", "Posted by Owner").
// Buyers say "builder" for a developer.
export const POSTER = Object.freeze({ OWNER: "owner", AGENT: "agent", BUILDER: "builder" });

export const POSTER_LABELS = Object.freeze({
  [POSTER.OWNER]: "Owner",
  [POSTER.AGENT]: "Agent",
  [POSTER.BUILDER]: "Builder",
});

// Who posted a public listing. Listings saved before listedBy existed keep the
// old rule (a developer name means a builder posted it); where ownerModel is
// known (admin views), a developer account (User) also means a builder.
export const posterOf = (property) => {
  switch (property?.listedBy) {
    case LISTED_BY.OWNER:
      return POSTER.OWNER;
    case LISTED_BY.AGENT:
      return POSTER.AGENT;
    case LISTED_BY.DEVELOPER:
      return POSTER.BUILDER;
    default:
      return property?.developerName || property?.ownerModel === OWNER_MODEL.USER
        ? POSTER.BUILDER
        : POSTER.OWNER;
  }
};

export const AGENT_STATUS = Object.freeze({
  NONE: "none",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
});
