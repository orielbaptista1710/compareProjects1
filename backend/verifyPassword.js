const bcrypt = require('bcryptjs');

async function verifyPassword() {
  const hash = '$2b$10$NF6zN3p475uTxeTzfJd2X.qjUUw5izFZnqnbrxm6kZwGFsQsHilHe';
  const password = 'caribonara1945'; // The password you're testing
  
  try {
    const match = await bcrypt.compare(password, hash);
    console.log('----------------------------------');
    console.log('Password verification results:');
    console.log('Stored hash:', hash);
    console.log('Test password:', password);
    console.log('Match result:', match);
    console.log('----------------------------------');
    
    if (match) {
      console.log('✅ Password matches the hash!');
    } else {
      console.log('❌ Password does NOT match the hash!');
      console.log('Possible reasons:');
      console.log('- The password is incorrect');
      console.log('- There are hidden whitespace characters');
      console.log('- The hash was corrupted');
    }
  } catch (err) {
    console.error('Error during comparison:', err);
  }
}

verifyPassword();