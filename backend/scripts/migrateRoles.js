// backend/scripts/migrateRoles.js
//
// One-off, idempotent data migration for the customer/agent/developer role
// system. Safe by default: without --apply it only prints what WOULD change.
//
//   node scripts/migrateRoles.js            # dry run — counts only
//   node scripts/migrateRoles.js --apply    # take a Mongo backup first!
//
// Run order for a release: deploy the code (it accepts both old and new values),
// dry run against prod, back up, --apply, then check developer login + /dashboard.
// Running it twice is harmless: every step only matches documents not yet migrated.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { USER_ROLES, LISTED_BY, AGENT_STATUS, OWNER_MODEL } from '../constants/roles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const apply = process.argv.includes('--apply');

// Raw driver updates on purpose: no Mongoose hooks or validation, and only the
// fields named here are touched (projectKey, slug, geo stay exactly as they are).
const STEPS = [
  {
    label: 'properties: missing ownerModel → "User" (every existing listing belongs to a User)',
    collection: 'properties',
    filter: { ownerModel: { $exists: false } },
    update: { $set: { ownerModel: OWNER_MODEL.USER } },
  },
  {
    label: 'properties: missing listedBy on non-scraped listings → "developer"',
    collection: 'properties',
    filter: { listedBy: null, dataSource: { $ne: 'scraper' } },
    update: { $set: { listedBy: LISTED_BY.DEVELOPER } },
  },
  {
    label: 'users: role "user" → "developer" (renamed)',
    collection: 'users',
    filter: { role: USER_ROLES.LEGACY_DEVELOPER },
    update: { $set: { role: USER_ROLES.DEVELOPER } },
  },
  {
    label: 'customers: missing isActive → true',
    collection: 'customers',
    filter: { isActive: { $exists: false } },
    update: { $set: { isActive: true } },
  },
  {
    label: 'customers: missing agent.status → "none"',
    collection: 'customers',
    filter: { 'agent.status': { $exists: false } },
    update: { $set: { 'agent.status': AGENT_STATUS.NONE } },
  },
];

// Reported only — deliberately left for a human decision.
const REPORTS = [
  {
    label: 'properties: scraped listings with no listedBy (left as-is)',
    collection: 'properties',
    filter: { listedBy: null, dataSource: 'scraper' },
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  console.log(`${apply ? 'APPLYING' : 'DRY RUN (no changes)'} on database "${db.databaseName}"\n`);

  for (const step of STEPS) {
    const coll = db.collection(step.collection);
    if (apply) {
      const { matchedCount, modifiedCount } = await coll.updateMany(step.filter, step.update);
      console.log(`✔ ${step.label}\n    matched ${matchedCount}, modified ${modifiedCount}`);
    } else {
      const count = await coll.countDocuments(step.filter);
      console.log(`• ${step.label}\n    would modify ${count}`);
    }
  }

  for (const report of REPORTS) {
    const count = await db.collection(report.collection).countDocuments(report.filter);
    console.log(`ℹ ${report.label}: ${count}`);
  }

  if (!apply) console.log('\nNothing was changed. Re-run with --apply after taking a backup.');
};

run()
  .catch((err) => {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
