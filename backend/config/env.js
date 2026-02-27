// // backend/config/env.js
// import dotenv from "dotenv";
// dotenv.config();

// const requiredVars = [
//   "MONGO_URI",
//   "LEADS_MONGO_URI",
//   "PORT",
//   "JWT_SECRET",
//   "JWT_SECRET_CUSTOMER",
//   "ADMIN_SECRET"
// ];

// requiredVars.forEach((key) => {
//   if (!process.env[key]) {
//     throw new Error(`❌ Missing required environment variable: ${key}`);
//   }
// });

// export const config = {
//   port: process.env.PORT,
//   mongoUri: process.env.MONGO_URI,
//   leadsMongoUri: process.env.LEADS_MONGO_URI,
//   frontendUrl: process.env.REACT_APP_FRONTEND_URL,
//   nodeEnv: process.env.NODE_ENV,
// };




