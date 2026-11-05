// backend/scripts/deleteCustomer.js
//
// Permanently deletes a customer / owner / agent account everywhere it lives
// (account erasure). Safe by default: without --apply it only prints what it
// WOULD delete.
//
//   npm run delete-customer -- --email asha@example.com            # dry run
//   npm run delete-customer -- --email asha@example.com --apply    # delete
//   npm run delete-customer -- --uid <firebaseUid> [--apply]
//
// Deletes, in this order (re-running after a partial failure is safe):
//   1. the Firebase login (so they can't log back in mid-way and recreate it)
//   2. every listing they posted (Mongo properties, ownerModel 'Customer')
//   3. enquiries THEY sent as a buyer (Postgres customer leads matching their
//      verified email or Firebase-verified phone) and those leads' site
//      visits / activities
//   4. their Customer record (saved + compare lists live on it)
// Kept: enquiries OTHER buyers sent about their listings (that's the other
// buyers' data) — the count is printed. Uploaded photos stay on Cloudinary;
// the count is printed so they can be cleaned up separately.
//
// --apply ends by looking everything up again and printing ✅/❌ per item.
// Re-running the dry run later is also a check: "Nothing found…" = all gone.
//
// The backend .env decides which Firebase project / Mongo / Postgres this
// touches — today that is PRODUCTION. Run the dry run first.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { parseArgs } from 'util';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import Customer from '../models/Customer.js';
import Property from '../models/Property.js';
import { OWNER_MODEL } from '../constants/roles.js';

// Read their config from process.env when imported, so load them after dotenv.
const { default: customerAdminFire } = await import('../config/firebaseAdmin.js');
const { default: prisma } = await import('../config/prisma.js');

const fail = (msg) => {
  console.error(`❌ ${msg}`);
  process.exit(1);
};

const { values: args } = parseArgs({
  options: {
    email: { type: 'string' },
    uid: { type: 'string' },
    apply: { type: 'boolean', default: false },
  },
});

const email = args.email?.trim().toLowerCase();
const uid = args.uid?.trim();
if (!email === !uid) {
  fail('Usage: npm run delete-customer -- --email <email> | --uid <firebaseUid> [--apply]');
}

// Enough to recognise the account, not to copy its contact details.
// "+919876543210" → "******3210", "asha@example.com" → "a***@example.com", "Asha" → "A***"
const maskPhone = (phone) => (phone ? `******${phone.slice(-4)}` : '—');
const maskEmail = (value) => {
  if (!value) return '—';
  const [name, domain] = value.split('@');
  return domain ? `${name[0]}***@${domain}` : `${value[0]}***`;
};
const maskName = (name) => (name ? `${name[0]}***` : '—');

// Leads store a 10-digit number; the customer record stores "+91XXXXXXXXXX".
const lastTenDigits = (phone) => phone?.replace(/\D/g, '').slice(-10) || null;

// Uploaded files on a listing, for the "left on Cloudinary" count.
const countFiles = (p) =>
  [p.coverImage?.url, p.brochure?.url].filter(Boolean).length +
  (p.galleryImages?.length || 0) +
  (p.mediaFiles?.length || 0) +
  (p.floorPlans?.filter((f) => f.imageUrl).length || 0);

const findFirebaseUser = async () => {
  try {
    return uid
      ? await customerAdminFire.auth().getUser(uid)
      : await customerAdminFire.auth().getUserByEmail(email);
  } catch (err) {
    if (err.code === 'auth/user-not-found') return null;
    throw err;
  }
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const firebaseUser = await findFirebaseUser();
  const firebaseUid = firebaseUser?.uid ?? uid;
  // After a partial run the Firebase login may already be gone; fall back to
  // the email on the Mongo record so the rest can still be cleaned up.
  const customer = await Customer.findOne(
    firebaseUid ? { firebaseUid } : { customerEmail: email }
  ).lean();

  if (!firebaseUser && !customer) {
    console.log('Nothing found for that account — it may already be deleted.');
    return;
  }

  // Their enquiries are matched only on contact details they've proven they
  // own, so a sign-up using someone else's email or phone can't get that
  // person's enquiries erased: the email only once verified, the phone only
  // when Firebase verified it (the signup phone is typed, never checked).
  const emailVerified = firebaseUser?.emailVerified === true || customer?.emailVerified === true;
  const customerEmail = emailVerified
    ? (customer?.customerEmail || firebaseUser?.email || email)?.toLowerCase()
    : null;
  const phone10 = lastTenDigits(firebaseUser?.phoneNumber);

  const listings = customer
    ? await Property.find({ userId: customer._id, ownerModel: OWNER_MODEL.CUSTOMER })
        .select('_id coverImage brochure galleryImages mediaFiles floorPlans')
        .lean()
    : [];
  const listingIds = listings.map((p) => String(p._id));
  const files = listings.reduce((sum, p) => sum + countFiles(p), 0);

  const contactMatches = [
    ...(customerEmail ? [{ email: customerEmail }] : []),
    ...(phone10 ? [{ phone: phone10 }] : []),
  ];
  // Buyer enquiries only — developer partner enquiries are a different person's.
  const ownLeadFilter = { leadType: 'customer', OR: contactMatches };
  const ownLeads = contactMatches.length
    ? await prisma.lead.findMany({ where: ownLeadFilter, select: { id: true } })
    : [];
  const ownLeadIds = ownLeads.map((l) => l.id);
  const othersLeadsAboutListings = listingIds.length
    ? await prisma.lead.count({ where: { propertyId: { in: listingIds }, id: { notIn: ownLeadIds } } })
    : 0;

  console.log(`\n${args.apply ? 'DELETING' : 'DRY RUN — nothing will be deleted'}\n`);
  console.log(`Firebase login:      ${firebaseUser ? maskEmail(firebaseUser.email ?? firebaseUser.uid) : 'not found (already deleted?)'}`);
  console.log(`Customer record:     ${customer ? `${maskName(customer.customerName)} · ${maskPhone(customer.customerPhone)} · agent: ${customer.agent?.status ?? 'none'}` : 'not found'}`);
  console.log(`Listings:            ${listings.length}`);
  console.log(`Their enquiries:     ${ownLeadIds.length} (+ their site visits / activities)` +
    (emailVerified ? '' : ' — email not verified, so enquiries are not matched by email'));
  console.log(`Kept — other buyers' enquiries about their listings: ${othersLeadsAboutListings}`);
  console.log(`Left on Cloudinary — uploaded files on those listings: ${files}\n`);

  if (!args.apply) {
    console.log('Run again with --apply to delete. Take a Mongo backup first.');
    return;
  }

  if (firebaseUser) {
    await customerAdminFire.auth().deleteUser(firebaseUser.uid);
    console.log('✅ Firebase login deleted');
  }
  if (listings.length) {
    const { deletedCount } = await Property.deleteMany({ _id: { $in: listings.map((p) => p._id) } });
    console.log(`✅ ${deletedCount} listing(s) deleted`);
  }
  if (ownLeadIds.length) {
    // Site visits have no cascade on the lead relation; activities do.
    await prisma.$transaction([
      prisma.siteVisit.deleteMany({ where: { leadId: { in: ownLeadIds } } }),
      prisma.lead.deleteMany({ where: { id: { in: ownLeadIds } } }),
    ]);
    console.log(`✅ ${ownLeadIds.length} enquiry(ies) deleted`);
  }
  if (customer) {
    await Customer.deleteOne({ _id: customer._id });
    console.log('✅ Customer record deleted');
  }

  // Look everything up again, so nobody has to open the Firebase console or
  // Atlas to confirm it's gone.
  console.log('\nChecking…');
  const checks = [
    ['Firebase login gone', !(await findFirebaseUser())],
    [
      'Customer record gone',
      !(await Customer.exists(customer ? { _id: customer._id } : { firebaseUid: firebaseUid ?? null })),
    ],
    [
      'No listings left',
      !customer ||
        (await Property.countDocuments({ userId: customer._id, ownerModel: OWNER_MODEL.CUSTOMER })) === 0,
    ],
    [
      'Their enquiries gone',
      !ownLeadIds.length || (await prisma.lead.count({ where: { id: { in: ownLeadIds } } })) === 0,
    ],
  ];
  for (const [label, ok] of checks) console.log(`${ok ? '✅' : '❌ NOT'} ${label}`);

  if (checks.every(([, ok]) => ok)) {
    console.log('\nDone. The live site may show deleted listings for up to 2 minutes (cache).');
  } else {
    console.log('\nSomething is still there — run the same command again.');
    process.exitCode = 1;
  }
};

try {
  await run();
} catch (err) {
  console.error('❌ Error:', err.message);
  console.error('Nothing after the failed step ran. Fix the cause and run the same command again.');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await prisma.$disconnect();
  await customerAdminFire.app().delete();
}
