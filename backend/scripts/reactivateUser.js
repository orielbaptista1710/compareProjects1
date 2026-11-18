//backend/scripts/reactivateUser.js
//
// Undoes scripts/deactivateUser.js: allows the login again and puts back the
// listings that deactivation hid. The running server's listing cache clears
// itself within a few minutes.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { reactivateDeveloper } from '../services/developerAccountService.js';

const reactivateUser = async (rawUsername) => {
  const username = rawUsername?.trim().toLowerCase();
  if (!username) {
    console.error('❌ Usage: npm run reactivate-user -- <username>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await reactivateDeveloper(username);
    if (!result) {
      console.log('❌ User not found');
      process.exitCode = 1;
      return;
    }

    console.log(`✅ User ${result.user.username} reactivated; ${result.listings} listing(s) back online`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

// npm run reactivate-user -- <username>
reactivateUser(process.argv[2]);
