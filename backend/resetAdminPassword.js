const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path

async function resetPassword() {
  await mongoose.connect('mongodb://127.0.0.1:27017/comparedb');

  const newHash = await bcrypt.hash('caribonara1945', 10); // Rehash the SAME password
  await User.updateOne(
    { username: 'admin1' },
    { $set: { password: newHash } }
  );

  console.log('✅ Admin password reset with new hash:', newHash);
  mongoose.connection.close();
}

resetPassword();