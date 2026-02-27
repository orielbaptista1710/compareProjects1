// //backend/config/db.js
// import mongoose from "mongoose";
// import { config } from "./env.js";

// export const mainCompareConnection =
//   mongoose.createConnection(config.mongoUri);

// export const leadsCompareConnection =
//   mongoose.createConnection(config.leadsMongoUri);

// mainCompareConnection.on("connected", () => {
//   console.log("Main DB connected:", mainCompareConnection.name);
//   console.log("✅ Host:", mainCompareConnection.host);
// });

// leadsCompareConnection.on("connected", () => {
//   console.log("Leads DB connected:", leadsCompareConnection.name);
//   console.log("✅ Host:", leadsCompareConnection.host);
// });

// mainCompareConnection.on("error", (err) => {
//   console.error("Main DB error:", err);
//   process.exit(1);
// });

// leadsCompareConnection.on("error", (err) => {
//   console.error("Leads DB error:", err);
//   process.exit(1);
// });
