const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixFileTypeLength() {
    try {
        console.log('🔧 Fixing file_type column length in microsoft_documents table...');

        // Alter the file_type column to be VARCHAR(255) instead of VARCHAR(50)
        await pool.query(`
            ALTER TABLE microsoft_documents
            ALTER COLUMN file_type TYPE VARCHAR(255);
        `);

        console.log('✅ file_type column updated to VARCHAR(255)');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

fixFileTypeLength();
