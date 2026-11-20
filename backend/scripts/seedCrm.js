// backend/scripts/seedCrm.js
//
// Fills a STAGING CRM database with test data so the CRM frontend can be
// built against real endpoints: 2 zones, one staff account per role and
// 24 fake leads. Never run it against production.
//
//   npm run seed:crm                # dry run: shows what it would create
//   npm run seed:crm -- --apply     # writes, prints the 4 passwords once
//
// --apply only works when CRM_SEED_ALLOWED_HOST in backend/.env equals the
// database host in DATABASE_URL (the dry run prints it). Set it on the machine
// that is allowed to seed, and only once staging is a separate database from
// production, so a .env pointing at real data can't be seeded by accident.
// Safe to re-run: zones, pincodes and leads that already exist are skipped.
// It never deletes or changes existing leads. Staff accounts get NEW
// passwords on every --apply run (use that if a password is lost), and
// their existing sessions are revoked.

import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { CrmRole, LeadCategory, LeadStage, ListerType } from '@prisma/client';
import { parseArgs } from 'util';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { generatePassword } from './lib/passwords.js';

// Read DATABASE_URL when imported, so load them after dotenv.
const { default: prisma } = await import('../config/prisma.js');
const { BCRYPT_COST } = await import('../services/crm/crmAuthService.js');

const fail = (msg) => {
  console.error(`❌ ${msg}`);
  process.exit(1);
};

const { values: args } = parseArgs({
  options: { apply: { type: 'boolean', default: false } },
});

if (process.env.NODE_ENV === 'production') fail('Refusing to seed: NODE_ENV is production.');
if (!process.env.DATABASE_URL) fail('DATABASE_URL is not set in backend/.env.');
const dbHost = new URL(process.env.DATABASE_URL).host;
if (args.apply && process.env.CRM_SEED_ALLOWED_HOST !== dbHost) {
  fail(`Refusing to seed ${dbHost}: set CRM_SEED_ALLOWED_HOST=${dbHost} in backend/.env only if this is the staging database.`);
}

const ZONES = [
  { name: 'Bengaluru East', city: 'Bengaluru', pincodes: ['560066', '560037', '560048'] },
  { name: 'Mumbai West', city: 'Mumbai', pincodes: ['400053', '400050', '400049'] },
];

const STAFF = [
  { email: 'admin@crm-staging.test', name: 'Test Admin', role: CrmRole.admin },
  { email: 'crm.manager@crm-staging.test', name: 'Test CRM Manager', role: CrmRole.crm_manager },
  { email: 'zonal.manager@crm-staging.test', name: 'Test Zonal Manager', role: CrmRole.zonal_manager, zone: 'Bengaluru East', isManager: true },
  { email: 'sales.rep@crm-staging.test', name: 'Test Sales Rep', role: CrmRole.sales_rep, zone: 'Bengaluru East' },
];

// The last two pincodes belong to no zone, so those leads land in Unzoned.
const PLACES = [
  { city: 'Bengaluru', locality: 'Whitefield', pincode: '560066' },
  { city: 'Bengaluru', locality: 'Marathahalli', pincode: '560037' },
  { city: 'Bengaluru', locality: 'Mahadevapura', pincode: '560048' },
  { city: 'Mumbai', locality: 'Andheri West', pincode: '400053' },
  { city: 'Mumbai', locality: 'Bandra West', pincode: '400050' },
  { city: 'Pune', locality: 'Baner', pincode: '411045' },
  { city: 'Hyderabad', locality: 'Gachibowli', pincode: '500032' },
];

const STAGES = Object.values(LeadStage);
const LISTERS = Object.values(ListerType);
const BUDGETS = ['50 to 80 L', '80 L to 1 Cr', '1 to 1.5 Cr', '1.5 to 2 Cr'];
const LEAD_COUNT = 24;
const DAY = 24 * 60 * 60_000;

// Fake numbers in one block (+91900000xxxx) so seed leads are easy to spot.
const seedPhone = (i) => `+91900000${String(i).padStart(4, '0')}`;

const buildLead = (i, zoneIdByPincode, rep, now) => {
  const nn = String(i).padStart(2, '0');
  const isPartner = i % 6 === 0;
  const place = PLACES[i % PLACES.length];
  const stage = STAGES[i % STAGES.length];
  const zoneId = zoneIdByPincode.get(place.pincode) ?? null;
  // Give the sales rep every other lead in their own zone.
  const assignedTo = rep && zoneId === rep.zoneId && i % 2 === 0 ? rep.id : null;
  const createdAt = new Date(now - i * DAY);

  const enquiries = Array.from({ length: i % 3 === 0 ? 2 : 1 }, (_, k) => ({
    channel: 'web',
    source: 'staging_seed',
    idempotencyKey: crypto.randomUUID(),
    propertyTitle: isPartner ? null : `${(i % 4) + 1} BHK in ${place.locality}`,
    listerType: isPartner ? null : LISTERS[i % LISTERS.length],
    ...place,
    budget: isPartner ? null : BUDGETS[i % BUDGETS.length],
    message: isPartner ? 'We would like to list our new project with you.' : 'Is a weekend site visit possible?',
    loanInterest: isPartner ? null : i % 2 === 0,
    consentVersion: 'staging-seed',
    consentAt: createdAt,
    rawPayload: isPartner ? { seed: true, companyName: `Test Developers ${nn} Pvt Ltd` } : { seed: true },
    createdAt: new Date(createdAt.getTime() + k * DAY),
  }));

  return {
    category: isPartner ? LeadCategory.developer_partner : LeadCategory.buyer,
    name: isPartner ? `Test Developer ${nn}` : `Test Buyer ${nn}`,
    phone: seedPhone(i),
    email: `test.lead${nn}@example.com`,
    stage,
    lostReason: stage === LeadStage.lost ? 'Bought elsewhere' : null,
    assignedTo,
    zoneId,
    firstContactedAt: stage === LeadStage.new ? null : createdAt,
    lastActivityAt: enquiries.at(-1).createdAt,
    createdAt,
    enquiries: { create: enquiries },
  };
};

const run = async () => {
  console.log(`Database: ${dbHost}`);
  console.log(args.apply ? 'APPLYING\n' : 'DRY RUN: nothing will be written\n');

  const phones = Array.from({ length: LEAD_COUNT }, (_, i) => seedPhone(i + 1));
  const [existingZones, existingStaff, existingLeads] = await Promise.all([
    prisma.zone.findMany({ where: { OR: ZONES.map(({ city, name }) => ({ city, name })) }, select: { name: true } }),
    prisma.crmUser.findMany({ where: { email: { in: STAFF.map((s) => s.email) } }, select: { email: true } }),
    prisma.lead.findMany({ where: { phone: { in: phones } }, select: { phone: true } }),
  ]);
  const haveLead = new Set(existingLeads.map((l) => l.phone));

  console.log(`Zones:  ${ZONES.length - existingZones.length} to create, ${existingZones.length} already there`);
  console.log(`Staff:  ${STAFF.length - existingStaff.length} to create, ${existingStaff.length} already there (new passwords)`);
  console.log(`Leads:  ${LEAD_COUNT - haveLead.size} to create, ${haveLead.size} already there (skipped)`);

  if (!args.apply) {
    console.log(`\nTo write: set CRM_SEED_ALLOWED_HOST=${dbHost} in backend/.env (staging only), then npm run seed:crm -- --apply`);
    return;
  }

  const zoneIdByName = new Map();
  for (const { name, city, pincodes } of ZONES) {
    const zone = await prisma.zone.upsert({
      where: { city_name: { city, name } },
      update: {},
      create: { name, city },
    });
    zoneIdByName.set(name, zone.id);
    // skipDuplicates: a pincode already mapped to another zone stays where it is.
    await prisma.zoneArea.createMany({
      data: pincodes.map((pincode) => ({ zoneId: zone.id, pincode })),
      skipDuplicates: true,
    });
  }
  const areas = await prisma.zoneArea.findMany({
    where: { pincode: { in: PLACES.map((p) => p.pincode) } },
    select: { pincode: true, zoneId: true },
  });
  const zoneIdByPincode = new Map(areas.map((a) => [a.pincode, a.zoneId]));

  const credentials = [];
  let rep = null;
  for (const { email, name, role, zone, isManager = false } of STAFF) {
    const password = generatePassword();
    const hash = await bcrypt.hash(password, BCRYPT_COST);
    const user = await prisma.crmUser.upsert({
      where: { email },
      update: { name, role, password: hash, isActive: true, failedLogins: 0, lockedUntil: null },
      create: { email, name, role, password: hash },
    });
    // New password: anyone still logged in with the old one is logged out.
    await prisma.crmSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const zoneId = zone ? zoneIdByName.get(zone) : null;
    if (zoneId) {
      await prisma.zoneStaff.upsert({
        where: { zoneId_userId: { zoneId, userId: user.id } },
        update: { isManager },
        create: { zoneId, userId: user.id, isManager },
      });
    }
    if (role === CrmRole.sales_rep) rep = { id: user.id, zoneId };
    credentials.push({ role, email, password });
  }
  // Printed before the leads are written, so a later failure can't lose them.
  console.log('Staff logins (shown once; send privately, never in the same message as the docs):');
  console.table(credentials);

  const now = Date.now();
  let created = 0;
  for (let i = 1; i <= LEAD_COUNT; i++) {
    if (haveLead.has(seedPhone(i))) continue;
    await prisma.lead.create({ data: buildLead(i, zoneIdByPincode, rep, now) });
    created++;
  }

  console.log(`\n✅ ${ZONES.length} zones ready, ${STAFF.length} staff accounts ready, ${created} leads created.`);
};

try {
  await run();
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
