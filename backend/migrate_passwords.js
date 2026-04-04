const mongoose = require('mongoose');
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const salt = await bcrypt.genSalt(10);
        const defaultHash = await bcrypt.hash('admin', salt);
        
        const result = await User.updateMany(
            { password: { $exists: false } },
            { $set: { password: defaultHash } }
        );
        
        console.log(`Migrated ${result.modifiedCount} users with default password 'admin'`);
        
        // Also update users with null or empty password
        const result2 = await User.updateMany(
            { password: { $in: [null, ""] } },
            { $set: { password: defaultHash } }
        );
        console.log(`Updated ${result2.modifiedCount} users with null/empty passwords`);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrate();
