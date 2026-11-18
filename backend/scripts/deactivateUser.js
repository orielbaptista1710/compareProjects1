//backend/scripts/deactivateUser.js
//
// Blocks a developer/admin login and hides that account's live listings.
// Undo with scripts/reactivateUser.js. The running server's listing cache
// clears itself within a few minutes.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { deactivateDeveloper } from '../services/developerAccountService.js';

const deactivateUser = async (rawUsername) => {
  const username = rawUsername?.trim().toLowerCase();
  if (!username) {
    console.error('❌ Usage: npm run deactivate-user -- <username>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await deactivateDeveloper(username);
    if (!result) {
      console.log('❌ User not found');
      process.exitCode = 1;
      return;
    }

    console.log(`✅ User ${result.user.username} deactivated; ${result.listings} live listing(s) hidden`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

// npm run deactivate-user -- <username>
deactivateUser(process.argv[2]);
