// backend/scripts/resetPassword.js
//
// Manual password reset for developers and admins, by username.
//
// Usage:
//   npm run reset-password -- --username acme [--password '<at least 12 chars>']
//
// Leave out --password to get a generated one, printed once only. Confirm the
// person's identity through a channel other than the one the request came in on
// (a "please reset my password" email is a classic social-engineering vector),
// then share the password securely.
//
// IMPORTANT: this uses user.save(), not findOneAndUpdate(). The password-hashing
// pre('save') hook in User.js only fires on .save() — findOneAndUpdate would
// store the password in PLAIN TEXT.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { parseArgs } from 'util';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';
import { generatePassword, checkPassword } from './lib/passwords.js';

const fail = (msg) => {
  console.error(`❌ ${msg}`);
  process.exit(1);
};

const { values: args } = parseArgs({
  options: {
    username: { type: 'string' },
    password: { type: 'string' },
  },
});

const username = args.username?.trim().toLowerCase();
if (!username) fail('Required: --username <name>');

// Trimmed because login trims the password it receives (authController.js).
const generated = !args.password;
const newPassword = generated ? generatePassword() : args.password.trim();
const problem = checkPassword(newPassword, username);
if (problem) fail(problem);

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({ username });
    if (!user) fail(`No user found with username: ${username}`);

    if (!user.isActive) {
      console.log(`⚠️  ${user.username} is deactivated — resetting the password does NOT reactivate it.`);
    }

    user.password = newPassword; // pre('save') hook hashes this
    await user.save();

    console.log('✅ Password reset');
    console.log(`   Username: ${user.username}`);
    console.log(`   Role:     ${user.role}`);
    if (generated) console.log(`   Password: ${newPassword}   (shown once — share it securely)`);
  } catch (err) {
    console.error('❌ Error resetting password:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

resetPassword();
