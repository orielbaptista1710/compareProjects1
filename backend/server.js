const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes


console.log('Loading authRoutes');
app.use('/api/auth', require('./routes/authRoutes'));

console.log('Loading adminRoutes');
app.use('/api/admin', require('./routes/adminRoutes'));

console.log('Loading propertyRoutes');
app.use('/api/properties', require('./routes/propertyRoutes'));



const connectDB = async () => {
    try {
        console.log('Connect:', process.env.MONGO_URI);
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB error ❌', error.message);
        process.exit(1);
    }
};

connectDB();

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

