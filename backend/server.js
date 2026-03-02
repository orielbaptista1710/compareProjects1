import dotenv from 'dotenv';
dotenv.config();

import mongoose from "mongoose";
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import errorHandler from '../backend/middleware/errorMiddleware.js';


import customerRoutes from './routes/customerRoutes.js';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import customerActivityRoutes from './routes/customerActivityRoutes.js';
import discoverRoutes from './routes/discoverRoutes.js';

const app = express();
app.use(cors({ 
  origin: process.env.REACT_APP_FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

//what is this for tho - is just forcing JSON headers
app.use((req, res, next) => {
  // res.setHeader('Content-Type', 'application/json');
  next();
});

// Routes
// Routes
app.use('/api/customers', customerRoutes); /////////// replace with Clerk???
app.use('/api/auth', authRoutes);          /////////// replace with Clerk???
// app.use('/api/devlog', devResetPwdRoutes); /////////// replace with Clerk???
app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customerActivity', customerActivityRoutes);
// app.use('/api/leads', leacustomerdRoutes);
app.use('/api/discover', discoverRoutes);  //have to fix this 

app.get('/', (req, res) => {
  res.json({ message: "API is running 🚀" });
});

const connectDB = async () => {
    try {
        console.log('Connect:', process.env.MONGO_URI);
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
        console.log('Collections in database:', (await mongoose.connection.db.listCollections().toArray()).map(c => c.name));
        console.log('Database name being used:', mongoose.connection.name);


    } catch (error) {
        console.error('MongoDB error ❌', error.message);
        process.exit(1);
    }
};

connectDB();
 
app.use(errorHandler);

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
