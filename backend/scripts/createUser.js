// backend/scripts/createUser.js
//
// Creates a developer or admin account. There is no public signup for these
// roles: our team verifies the company, runs this script and hands over the
// credentials out-of-band (phone call / in person — not the same email as the
// username).
//
// Usage:
//   npm run create-user -- --username acme --name "Acme Builders" --role developer \
//     [--email ops@acme.in] [--phone +919800000000] [--company "Acme Builders Pvt Ltd"] \
//     [--password '<at least 12 chars>'] [--id <24-hex ObjectId>]
//
// Leave out --password to get a generated one (recommended: a password typed on
// the command line ends up in your shell history). It is printed once only.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { parseArgs } from 'util';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';
import { USER_ROLES } from '../constants/roles.js';
import { generatePassword, checkPassword } from './lib/passwords.js';

const ROLE_VALUES = {
  developer: USER_ROLES.DEVELOPER,
  admin: USER_ROLES.ADMIN,
};

const fail = (msg) => {
  console.error(`❌ ${msg}`);
  process.exit(1);
};

const { values: args } = parseArgs({
  options: {
    username: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    company: { type: 'string' },
    password: { type: 'string' },
    id: { type: 'string' },
  },
});

const username = args.username?.trim().toLowerCase();
const displayName = args.name?.trim();
const role = ROLE_VALUES[args.role];

if (!username || !displayName || !role) {
  fail('Required: --username <name> --name "<display name>" --role developer|admin');
}
if (args.id && !mongoose.Types.ObjectId.isValid(args.id)) fail('--id must be a 24-character hex ObjectId');

// Trimmed because login trims the password it receives (authController.js).
const generated = !args.password;
const password = generated ? generatePassword() : args.password.trim();
const problem = checkPassword(password, username);
if (problem) fail(problem);

const createUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({
      $or: [
        { username },
        ...(args.email ? [{ email: args.email.trim().toLowerCase() }] : []),
        ...(args.id ? [{ _id: args.id }] : []),
      ],
    });
    if (existing) fail(`An account already exists with that username/email/id (${existing.username})`);

    const user = await User.create({
      ...(args.id && { _id: args.id }),
      displayName,
      username,
      password, // hashed by the pre('save') hook in User.js
      role,
      ...(args.email && { email: args.email }),
      ...(args.phone && { phone: args.phone }),
      ...(args.company && { companyName: args.company }),
      migrationSource: 'manual',
    });

    console.log('✅ Account created');
    console.log(`   ID:       ${user._id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role:     ${args.role}`);
    if (generated) console.log(`   Password: ${password}   (shown once — share it securely)`);
  } catch (err) {
    console.error('❌ Error creating user:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createUser();
