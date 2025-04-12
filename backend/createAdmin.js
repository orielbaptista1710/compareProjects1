const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust path as needed

// Database connection
mongoose.connect('mongodb://127.0.0.1:27017/comparedb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createAdminUser() {
  try {
    // Admin user details
    const adminData = {
      displayName: "Admin User",
      username: "admin1",
      password: "caribonara1945", // Change this to a strong password
      role: "admin"
    };

    //
    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: adminData.username });
    if (existingAdmin) {
      console.log('Admin user already exists');
      mongoose.connection.close();
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);

    // Create the admin user
    const admin = new User(adminData);
    await admin.save();

    console.log('Admin user created successfully:', {
      displayName: admin.displayName,
      username: admin.username,
      role: admin.role,
      _id: admin._id
    });

  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the function
createAdminUser();