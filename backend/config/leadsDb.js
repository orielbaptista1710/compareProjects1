import mongoose from "mongoose";
import logger from "../utils/logger.js";

let leadsConnection;

export const connectLeadsDB = async () => {
  try {
    leadsConnection = mongoose.createConnection(
      process.env.LEADS_MONGO_URI
    );

    await leadsConnection.asPromise();  

    logger.info("Leads DB connected✅", {
    dbName: leadsConnection.name
    });

    return leadsConnection;

  } catch (error) {
    logger.error("Leads DB error ❌", error.message);
    process.exit(1);
  }
};

export const getLeadsConnection = () => {
  if (!leadsConnection) {
    throw new Error("Leads DB not initialized");
  }
  return leadsConnection;
};