import dotenv from 'dotenv'; 
dotenv.config();

import mongoose from "mongoose";
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import logger from './utils/logger.js';
import requestLogger from './middleware/requestLogger.js';
import originCheck from './middleware/originCheck.js';

import errorHandler from './middleware/errorMiddleware.js';

import customerRoutes from './routes/customerRoutes.js';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import customerActivityRoutes from './routes/customerActivityRoutes.js';
import discoverRoutes from './routes/discoverRoutes.js';

import leadRoutes from './routes/leadRoutes.js';
import crmRoutes from './routes/crmRoutes.js';

import newsRoutes from "./routes/newsRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
// import passwordResetRequestRoutes from './routes/passwordResetRequestRoutes.js';

import prisma from "./config/prisma.js";

const app = express();

app.set('trust proxy', 1);  // the the api differnce

// Security headers (HSTS, nosniff, frameguard, etc.). JSON-only API, so helmet's
// default CSP is harmless; CORP is relaxed so the SPA on its own origin can read responses.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// Comma-separated list, e.g. "http://localhost:5173,http://localhost:5174"
const allowedOrigins = (process.env.REACT_APP_FRONTEND_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(originCheck(allowedOrigins));  // CSRF: refuse cross-site writes (SEC-06)

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Health check for Render / uptime monitors — 503 if MongoDB is not connected
app.get('/api/health', (req, res) => {
  const mongoUp = mongoose.connection.readyState === 1;
  res.status(mongoUp ? 200 : 503).json({ status: mongoUp ? 'ok' : 'degraded', mongo: mongoUp });
});

// Routes
app.use('/api/customers', customerRoutes); 
app.use('/api/auth', authRoutes);          
app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customerActivity', customerActivityRoutes);
app.use('/api/discover', discoverRoutes);  //have to fix this 

app.use('/api/leads', leadRoutes);
app.use('/api/crm', crmRoutes);

app.use('/api/news', newsRoutes);
app.use("/api/locations", locationRoutes);
// app.use('/api/password-reset-requests', passwordResetRequestRoutes);


// TEST ROUTES

// app.get("/test-error", (req, res) => {
//   throw new Error("Test error triggered");
// });

// app.get("/test-requestid", (req, res) => {

//   logger.info("Inside controller", {
//     requestId: req.requestId
//   });

//   res.json({ requestId: req.requestId });

// });

// app.get("/test-slow", async (req, res) => {

//   await new Promise(resolve => setTimeout(resolve, 3000));

//   res.json({ message: "Slow response finished" });

// });


// app.get("/test-log", (req, res) => {

//   logger.info("Test log triggered", {
//     requestId: req.requestId
//   });

//   res.json({ message: "log created" });

// });

// app.get('/', (req, res) => {
//   res.json({ message: "API is running 🚀" });
// });


app.use(errorHandler);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info("Main DB connected ✅");
    return conn;
  } catch (error) {
    logger.error("MongoDB error ❌", error.message);
    process.exit(1);
  }
};

const connectPrisma = async () => {
  try {
    await prisma.$connect();
    logger.info("Postgres (Prisma) connected ✅");
  } catch (error) {
    logger.error("Postgres (Prisma) error ❌", error.message);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    await connectDB();        // Main DB (comparedb)
    logger.info("General MongoDB database selected", {
    dbName: mongoose.connection.name
    });

    await connectPrisma();    // Postgres (leads, via Prisma)

    app.listen(process.env.PORT, () => {
      logger.info(`Server running on port ${process.env.PORT}`);
    });

  } catch (error) {
    logger.error("Server startup failed ❌", error);
    process.exit(1);
  }
};

startServer();

const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  try {
    await prisma.$disconnect();
    await mongoose.connection.close();
    logger.info("All database connections closed, exiting");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown ❌", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
