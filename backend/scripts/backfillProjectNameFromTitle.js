// scripts/backfillProjectNameFromTitle.js
//
// One-time, idempotent migration for scraped listings that have no
// projectName: extracts a project name out of `title` (the only field that
// currently encodes it) and computes projectKey from it via the same
// buildProjectKey() util the Property model's pre('validate') hook and
// scripts/backfillProjectKey.js both use — so a doc fixed by this script
// groups identically to one saved normally through the app.
//
// Only handles title shapes that reliably encode a project name:
//   "<N> BHK <words> in <Project>, <Locality>, <City>"
//   "<N> and <M> BHK <words> in <Project>, <Locality>, <City>"
//   "<N> BHK <Project>, <Locality>, <City>"  (same source, missing "in")
// Everything else (and anything that looks like a generic/locality-only
// match) is left untouched: projectName stays null, the listing keeps
// rendering as its own single-unit card — never a wrong guess, never a
// wrong merge.
//
// SAFE BY DEFAULT: running with no flags only prints what it WOULD change.
// Nothing is written to MongoDB until you pass --apply.
//
// Known limitations (checked against this dataset before shipping — read
// before re-running on new data):
//   - Locality string variants split one project into two ("New Panvel" vs
//     "Panvel" in different titles for the same actual project) — buildProjectKey
//     uses locality/city as stored, with no fuzzy normalization. Causes a
//     missed grouping, never a wrong merge, so it's safe but incomplete.
//   - Spelling variants in the extracted name itself ("Rukhmini" vs "Rukmini")
//     have the same effect — split, not merged. No fuzzy matching here; would
//     need a manual alias map if this matters enough to fix.
//   - Resale listings aren't filtered out of this script's input (it only
//     requires bhk > 0) — but the live grouping aggregation separately
//     excludes listingType: 'resale' regardless of projectKey, so a resale
//     doc getting a projectKey here is harmless *as long as listingType is
//     set correctly upstream*. In this dataset, as of writing, NO document
//     (scraped or otherwise) has listingType set at all — confirmed via
//     dataSource/ownerName/brokerName all being empty for scraped docs — so
//     there's currently no resale data for this to mis-group. If a resale
//     source is added later, it must set listingType: 'resale' at write time,
//     or this protection silently does nothing for it.
//
// Usage (from backend/):
//   node scripts/backfillProjectNameFromTitle.js            # dry run, prints a sample
//   node scripts/backfillProjectNameFromTitle.js --apply    # actually writes
//   node scripts/backfillProjectNameFromTitle.js --apply --limit=50   # cap rows touched (smoke test)
import mongoose from "mongoose";
import dotenv from "dotenv";
import Property from "../models/Property.js";
import { buildProjectKey } from "../utils/projectKey.js";

dotenv.config();

const APPLY = process.argv.includes("--apply");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const ROW_LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : null;

const BATCH_SIZE = 500;
const SAMPLE_SIZE = 20;

// Group 1 = project name. Locality/city are NOT taken from the title — the
// document's own `locality`/`city` fields are already reliable, structured
// data; the title is only trusted for the one thing it alone encodes.
//
// WITH_IN  — "3 BHK Apartments in X, Locality, City" and "3 and 4 BHK Flats in X, …"
// NO_IN    — "3 BHK X, Locality, City" (same scrape source, just missing "Apartments in"),
//            only tried when the title has no " in " anywhere, so it can't misfire on
//            WITH_IN-shaped titles that happen not to match for some other reason.
// GENERIC  — rejects extractions that are clearly not a project name (a bare street,
//            "Builder Floor", a trailing "Property") rather than silently keeping junk.
const WITH_IN = /^\d+(?:\s+and\s+\d+)?\s*bhk\s+.+?\s+in\s+([^,]+?)\s*,/i;
const NO_IN   = /^\d+\s*bhk\s+([^,]+?)\s*,/i;
const GENERIC = /(\bproperty|\bfloors?|\bbuilder floor|\b(rd|road|marg))$/i;

// A chunk of the scraped titles has a literal two-character "\n" (backslash
// + the letter n) glued between phrases instead of real whitespace — e.g.
// `"2Baths\nFlat/Apartment for Sale\nin X"` (confirmed via char codes, not a
// real newline). That breaks WITH_IN's `\s+in\s+` check (the "in" isn't
// actually whitespace-bounded), silently falls through to the more
// permissive NO_IN pattern, and grabs the entire garbled phrase up to the
// first comma as "the project name." Normalizing it to a real space first
// fixes the underlying data problem instead of special-casing the regex.
const normalizeTitle = (title) =>
  (title || "").replace(/\\[nrt]/g, " ").replace(/\s+/g, " ").trim();

function extractProjectName(title, { city, locality } = {}) {
  const t = normalizeTitle(title);
  const match = WITH_IN.exec(t) || (!/\sin\s/i.test(t) ? NO_IN.exec(t) : null);
  if (!match) return null;

  const name = match[1].trim();
  if (name.length < 2 || name.length > 150) return null; // propertyInputValidator caps projectName at 150
  if (GENERIC.test(name)) return null;

  // Reject when the "project name" is really just the locality/city repeated
  // (a handful of titles have no distinct project name at all).
  const norm = (s) => (s || "").trim().toLowerCase();
  if ([city, locality].some((x) => norm(x) === norm(name))) return null;

  return name;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const query = {
    bhk: { $gt: 0 },
    $or: [{ projectName: null }, { projectName: { $exists: false } }, { projectName: "" }],
  };

  const cursor = Property.find(query).select("_id title developerName city locality").cursor();

  let scanned = 0;
  let matched = 0;
  let wouldUpdate = 0;
  let updated = 0;
  let ops = [];
  const sample = [];

  const flush = async () => {
    if (!APPLY || !ops.length) {
      ops = [];
      return;
    }
    const result = await Property.bulkWrite(ops, { ordered: false });
    updated += result.modifiedCount ?? 0;
    ops = [];
  };

  for await (const doc of cursor) {
    if (ROW_LIMIT != null && scanned >= ROW_LIMIT) break;
    scanned += 1;

    const projectName = extractProjectName(doc.title, { city: doc.city, locality: doc.locality });
    if (!projectName) continue;
    matched += 1;

    const projectKey = buildProjectKey({
      developerName: doc.developerName,
      projectName,
      city: doc.city,
      locality: doc.locality,
    });

    // Require both — a projectName with no projectKey (e.g. developerName
    // missing) would never group anyway, so leave the document untouched
    // rather than writing a name that silently does nothing.
    if (!projectKey) continue;

    wouldUpdate += 1;
    if (sample.length < SAMPLE_SIZE) {
      sample.push({
        title: doc.title,
        developerName: doc.developerName,
        locality: doc.locality,
        extractedProjectName: projectName,
        projectKey,
      });
    }

    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { projectName, projectKey } },
      },
    });

    if (ops.length >= BATCH_SIZE) await flush();
  }
  await flush();

  console.log(`Mode: ${APPLY ? "APPLY (writing to MongoDB)" : "DRY RUN (no writes — pass --apply to write)"}`);
  console.log(`Scanned: ${scanned} listings missing projectName`);
  console.log(`Title matched the known pattern: ${matched}`);
  console.log(`Would update / updated: ${wouldUpdate}${APPLY ? ` (modified: ${updated})` : ""}`);
  console.log(`\nSample of extracted projects (first ${sample.length}):`);
  console.log(JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
