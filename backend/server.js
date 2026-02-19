const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('../backend/middleware/errorMiddleware');
const dotenv = require('dotenv');

dotenv.config();

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
console.log('Loading customerRoutes');
app.use('/api/customers', require('./routes/customerRoutes'));

console.log('Loading customerActivityRoutes- saved, compared properties for customer profile');
app.use('/api/customerActivity', require('./routes/customerActivityRoutes'));

console.log('Loading authRoutes');
app.use('/api/auth', require('./routes/authRoutes'));   /////////////////////

console.log('Loading adminRoutes');
app.use('/api/admin', require('./routes/adminRoutes'));     

console.log('Loading propertyRoutes');
app.use('/api/properties', require('./routes/propertyRoutes'));

//have to still working on this funtion
console.log('Loading dev log Routes');
app.use('/api/devlog', require('./routes/devResetPwdRoutes'));

console.log('Loading discover Footer Routes');
app.use('/api/discover', require('./routes/discoverRoutes'));

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
