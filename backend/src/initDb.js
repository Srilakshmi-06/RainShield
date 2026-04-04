const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initializeDatabase = async () => {
    try {
        console.log('[PostgreSQL] Initializing schema...');
        const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
        await pool.query(schema);
        console.log('✅ PostgreSQL Tables Ready.');
        return true;
    } catch (err) {
        console.error('❌ PostgreSQL Init Error:', err.message);
        // Only exit if DATABASE_URL was explicitly provided and failed
        if (process.env.DATABASE_URL) {
            console.log('\nNote: Check your PostgreSQL service and DATABASE_URL.');
        } else {
            console.log('[PG Fallback] Continuing without PostgreSQL. Some features may be disabled.');
        }
        return false;
    }
};

if (require.main === module) {
    initializeDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { initializeDatabase };
