// backend/config/firebaseAdmin.js
import customerAdminFire from "firebase-admin";

let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  credential = customerAdminFire.credential.cert(serviceAccount);
} else {
  const { default: serviceAccount } = await import("./firebase-service-account.json", { assert: { type: "json" } });
  credential = customerAdminFire.credential.cert(serviceAccount);
}

customerAdminFire.initializeApp({ credential });

export default customerAdminFire;