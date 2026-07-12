//frontend-vite/src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const CustomerAuth = getAuth(app);
export default app;

//this is used to initialize the firebase app and get the auth instance





// const firebaseConfig = {
//   apiKey: "G-xxxxxxxxxxxxxx",
//   authDomain: "G-xxxxxxxxxxxxxx",
//   projectId: "cG-xxxxxxplacesholder keysxxxxxxxx",
//   storageBucket: "G-xxxxxxxxxxxxxx",
//   messagingSenderId: "G-xxxxxxxxxxxxxx",
//   appId: "G-xxxxxxxxxxxxxx",
//   measurementId: "G-xxxxxxxxxxxxxx"
// };