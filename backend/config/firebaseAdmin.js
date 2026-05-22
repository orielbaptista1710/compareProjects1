// backend/config/firebaseAdmin.js
import customerAdminFire from "firebase-admin";
import serviceAccount from "./firebase-service-account.json" with { type: "json" };

customerAdminFire.initializeApp({
  credential: customerAdminFire.credential.cert(serviceAccount)
});

export default customerAdminFire;

