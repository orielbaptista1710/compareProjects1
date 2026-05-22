//backend/utils/syncFirebaseUser.js — run once manually
import customerAdminFire from '../config/firebaseAdmin.js';
import Customer from '../models/Customer.js';

const syncUser = async (uid, name, email) => {
  await Customer.findOneAndUpdate(
    { firebaseUid: uid },
    { $set: { firebaseUid: uid, customerName: name, customerEmail: email } },
    { upsert: true, new: true }
  );
  console.log('Synced');
};

// Call with values from Firebase Console
syncUser('paste-uid-here', 'Customer Name', 'email@example.com');