const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('[MongoDB] Connecting to cluster...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Fail fast if no connection
            connectTimeoutMS: 10000,
        });
        console.log('✅ MongoDB Connected Successfully');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.error('Stack:', err.stack);
        console.warn('⚠️ Server will continue, but DB features will be disabled.');
    }
};

// Global config to avoid commands hanging when DB is down
mongoose.set('bufferCommands', false);

module.exports = connectDB;
