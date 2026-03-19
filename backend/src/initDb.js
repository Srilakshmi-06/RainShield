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
        console.log('Reading schema.sql...');
        const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
        
        console.log('Executing schema in PostgreSQL...');
        await pool.query(schema);
        
        console.log('✅ Database tables initialized successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error initializing database:', err.message);
        console.log('\nNote: Make sure your PostgreSQL server is running and the DATABASE_URL in .env is correct.');
        process.exit(1);
    }
};

initializeDatabase();
