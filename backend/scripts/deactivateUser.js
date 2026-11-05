//backend/scripts/deactivateUser.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';

const deactivateUser = async (rawUsername) => {
  const username = rawUsername?.trim().toLowerCase();
  if (!username) {
    console.error('❌ Usage: npm run deactivate-user -- <username>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const user = await User.findOneAndUpdate(
      { username },
      { isActive: false },
      { new: true }
    );

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`✅ User ${user.username} deactivated`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

// pass username as command line argument
// node scripts/deactivateUser.js johnsmith
deactivateUser(process.argv[2]);


// node scripts/deactivateUser.js username
// npm run deactivate-user username
