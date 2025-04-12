const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');  // Adjust the path to your User model

// 🔹 Connect to your MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/comparedb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function hashExistingPasswords() {
  try {
    // Fetch all users from the User collection
    const users = await User.find(); 

    for (let user of users) {
      // Check if the password is already hashed
      // bcrypt hashed passwords start with '$2a$', '$2b$', or '$2y$'
      if (!user.password || !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$') && !user.password.startsWith('$2y$')) {
        // Hash the password if it's plain-text
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);

        // Update the user's password with the hashed version
        await User.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );

        console.log(`Hashed password for ${user.username}`);
      } else {
        console.log(`Password for ${user.username} is already hashed.`);
      }
    }

    console.log("All plain-text passwords have been hashed.");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error updating passwords:", error.message);
  }
}

// Call the function to hash passwords
hashExistingPasswords();