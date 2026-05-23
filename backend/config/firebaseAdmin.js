// backend/config/firebaseAdmin.js
import customerAdminFire from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

customerAdminFire.initializeApp({
  credential: customerAdminFire.credential.cert(serviceAccount)
});

export default customerAdminFire;

