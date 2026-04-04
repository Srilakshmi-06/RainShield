const mongoose = require('mongoose');
const { User } = require('./src/models');
require('dotenv').config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}).limit(5);
        console.log('--- Sample Users ---');
        users.forEach(u => {
            console.log(`Phone: ${u.phone}, HasPassword: ${!!u.password}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
