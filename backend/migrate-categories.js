const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateCategories() {
    console.log('🔧 Adding category field to companies and contacts...');

    try {
        // Add category to crm_companies
        console.log('📊 Adding category to crm_companies...');
        await pool.query(`
            ALTER TABLE crm_companies
            ADD COLUMN IF NOT EXISTS category VARCHAR(100)
        `);
        console.log('✅ Category added to crm_companies');

        // Add category to crm_contacts
        console.log('📊 Adding category to crm_contacts...');
        await pool.query(`
            ALTER TABLE crm_contacts
            ADD COLUMN IF NOT EXISTS category VARCHAR(100)
        `);
        console.log('✅ Category added to crm_contacts');

        // Create indexes
        console.log('📊 Creating indexes...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_crm_companies_category ON crm_companies(category);
            CREATE INDEX IF NOT EXISTS idx_crm_contacts_category ON crm_contacts(category);
        `);
        console.log('✅ Indexes created');

        console.log('🎉 Category migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error migrating categories:', err.message);
        console.error('Details:', err);
        process.exit(1);
    }
}

migrateCategories();
