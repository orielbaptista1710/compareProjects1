// scripts/backfillProjectKey.js
//
// One-time, idempotent backfill: sets projectKey on any Property document
// that already has a projectName but no projectKey yet (e.g. projectName was
// set directly by a scraper/import, or copied in from elsewhere, bypassing
// the model's pre('validate') hook). Safe to re-run — only touches docs
// where projectKey is currently null/missing.
//
// Uses the native MongoDB driver (mongoose.connection.db), not the Mongoose
// model — Property.find()/Property.bulkWrite() was observed silently
// returning documents with _id: undefined in this environment, which makes
// every write match zero real documents with no error thrown. The raw
// driver has been reliable for every read/write used against this data.
//
// Resale/individual-seller listings often share a generic developerName
// placeholder ("Private / Resale Seller", "Resale Listing", etc.) — giving
// two unrelated sellers in the same locality the same projectKey would
// wrongly merge their listings onto one fake project card. This script sets
// listingType: 'resale' on those instead of computing a projectKey, which
// activates the live grouping aggregation's existing (until now unused)
// listingType !== 'resale' guard.
//
// SAFE BY DEFAULT: running with no flags only prints what it WOULD change.
// Nothing is written to MongoDB until you pass --apply.
//
// Usage (from backend/):
//   node scripts/backfillProjectKey.js            # dry run, prints a sample
//   node scripts/backfillProjectKey.js --apply    # actually writes
//   node scripts/backfillProjectKey.js --apply --limit=50   # cap rows touched (smoke test)
import mongoose from "mongoose";
import dotenv from "dotenv";
import { buildProjectKey } from "../utils/projectKey.js";

dotenv.config();

const APPLY = process.argv.includes("--apply");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const ROW_LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : null;

const BATCH_SIZE = 500;
const SAMPLE_SIZE = 20;

const RESALE_DEVELOPER_PATTERN = /resale/i;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const properties = mongoose.connection.db.collection("properties");

  const query = {
    projectName: { $exists: true, $nin: [null, ""] },
    $or: [{ projectKey: null }, { projectKey: { $exists: false } }],
  };
  const cursor = properties.find(query, {
    projection: { _id: 1, title: 1, developerName: 1, projectName: 1, city: 1, locality: 1, listingType: 1 },
  });

  let scanned = 0;
  let resaleFlagged = 0;
  let keyed = 0;
  let updated = 0;
  let ops = [];
  const sample = [];

  const flush = async () => {
    if (!APPLY || !ops.length) {
      ops = [];
      return;
    }
    const result = await properties.bulkWrite(ops, { ordered: false });
    updated += result.modifiedCount ?? 0;
    ops = [];
  };

  for await (const doc of cursor) {
    if (ROW_LIMIT != null && scanned >= ROW_LIMIT) break;
    scanned += 1;

    const projectName = String(doc.projectName);
    const isResalePlaceholder = RESALE_DEVELOPER_PATTERN.test(doc.developerName || "");

    let set;
    if (isResalePlaceholder) {
      if (doc.listingType === "resale") continue; // already flagged, nothing to do
      resaleFlagged += 1;
      set = { listingType: "resale" };
    } else {
      const projectKey = buildProjectKey({
        developerName: doc.developerName,
        projectName,
        city: doc.city,
        locality: doc.locality,
      });
      if (!projectKey) continue; // e.g. developerName missing — leave untouched
      keyed += 1;
      set = { projectKey };
    }

    if (sample.length < SAMPLE_SIZE) {
      sample.push({ _id: doc._id, title: doc.title, developerName: doc.developerName, projectName, ...set });
    }

    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: set } } });
    if (ops.length >= BATCH_SIZE) await flush();
  }
  await flush();

  console.log(`Mode: ${APPLY ? "APPLY (writing to MongoDB)" : "DRY RUN (no writes — pass --apply to write)"}`);
  console.log(`Scanned: ${scanned} properties with projectName but no projectKey`);
  console.log(`Resale-placeholder developerName (listingType set, no projectKey): ${resaleFlagged}`);
  console.log(`projectKey computed: ${keyed}`);
  console.log(`Total would update / updated: ${resaleFlagged + keyed}${APPLY ? ` (modified: ${updated})` : ""}`);
  console.log(`\nSample (first ${sample.length}):`);
  console.log(JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
