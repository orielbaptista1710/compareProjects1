// scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 

async function createAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('❌ MONGO_URI is not set in .env');
    }
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      throw new Error('❌ ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to database:', mongoose.connection.name);

    let admin = await User.findOne({ username: process.env.ADMIN_USERNAME, role: 'admin' });

    if (admin) {
      console.log(`ℹ️ Admin "${process.env.ADMIN_USERNAME}" already exists. Updating password...`);
      admin.password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await admin.save();
      console.log('🔑 Admin password updated successfully.');
    } else {
      console.log(`ℹ️ Creating new admin "${process.env.ADMIN_USERNAME}"...`);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      admin = new User({
        username: process.env.ADMIN_USERNAME,
        displayName: process.env.ADMIN_DISPLAY_NAME ,
        password: hashedPassword,
        role: 'admin',
      });
      await admin.save();
      console.log('✅ Admin user created successfully.');
    }

    console.log('👤 Admin details:', {
      id: admin._id.toString(),
      username: admin.username,
      role: admin.role,
      displayName: admin.displayName,
    });

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed.');
  }
}

createAdmin();
