const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path as needed

async function verifyAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/comparedb', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Checking for admin users...');
    
    const admin = await User.findOne({ role: 'admin' }).lean();
    
    if (admin) {
      console.log('\n✅ Admin user found:');
      console.log('---------------------');
      console.log(`Username: ${admin.username}`);
      console.log(`Display Name: ${admin.displayName}`);
      console.log(`User ID: ${admin._id}`);
      console.log(`Created: ${admin.createdAt}`);
      console.log('---------------------');
      
      // Count total admin users
      const adminCount = await User.countDocuments({ role: 'admin' });
      console.log(`Total admin users: ${adminCount}`);
    } else {
      console.log('\n❌ No admin user found in database');
    }
  } catch (error) {
    console.error('\n🔥 Error verifying admin:', error.message);
    process.exit(1); // Exit with error code
  } finally {
    await mongoose.connection.close();
    process.exit(0); // Exit successfully
  }
}

// Run the function
verifyAdmin();