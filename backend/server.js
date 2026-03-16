import dotenv from 'dotenv';
dotenv.config();

import mongoose from "mongoose";
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from './utils/logger.js';
import requestLogger from './middleware/requestLogger.js';

import errorHandler from './middleware/errorMiddleware.js';

import customerRoutes from './routes/customerRoutes.js';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import customerActivityRoutes from './routes/customerActivityRoutes.js';
import discoverRoutes from './routes/discoverRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import newsRoutes from "./routes/newsRoutes.js";

import { connectLeadsDB } from "./config/leadsDb.js";

const app = express();
app.use(cors({ 
  origin: process.env.REACT_APP_FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

//what is this for tho - is just forcing JSON headers
// app.use((req, res, next) => {
//   // res.setHeader('Content-Type', 'application/json');
//   next();
// });

// Routes
app.use('/api/customers', customerRoutes); /////////// replace with Clerk???
app.use('/api/auth', authRoutes);          /////////// replace with Clerk???
app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customerActivity', customerActivityRoutes);
app.use('/api/discover', discoverRoutes);  //have to fix this 
app.use('/api/leads', leadRoutes);
app.use('/api/news', newsRoutes);


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


app.get("/test-log", (req, res) => {

  logger.info("Test log triggered", {
    requestId: req.requestId
  });

  res.json({ message: "log created" });

});

app.get('/', (req, res) => {
  res.json({ message: "API is running 🚀" });
});


app.use(errorHandler);


// const connectDB = async () => {
//     try {
//         console.log('Connect:', process.env.MONGO_URI);
//         const conn = await mongoose.connect(process.env.MONGO_URI, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });
//         console.log('MongoDB connected');
//         console.log('Collections in database:', (await mongoose.connection.db.listCollections().toArray()).map(c => c.name));
//         console.log('Database name being used:', mongoose.connection.name);


//     } catch (error) {
//         console.error('MongoDB error ❌', error.message);
//         process.exit(1);
//     }
// };


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

const startServer = async () => {
  try {
    await connectDB();        // Main DB (comparedb)
    logger.info("General MongoDB database selected", {
    dbName: mongoose.connection.name
    });

    await connectLeadsDB();   // Leads DB (leadsdb)


    app.listen(process.env.PORT, () => {
      logger.info(`Server running on port ${process.env.PORT}`);
    });

  } catch (error) {
    logger.error("Server startup failed ❌", error);
    process.exit(1);
  }
};

startServer();
