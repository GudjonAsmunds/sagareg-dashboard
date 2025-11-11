const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateCompanies() {
    console.log('🔧 Migrating database to add companies support...');

    try {
        // Create Companies table
        console.log('📊 Creating companies table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS crm_companies (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                industry VARCHAR(100),
                website VARCHAR(255),
                phone VARCHAR(50),
                email VARCHAR(255),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                country VARCHAR(100),
                postal_code VARCHAR(20),
                employee_count VARCHAR(50),
                revenue_range VARCHAR(50),
                linkedin_url VARCHAR(255),
                description TEXT,
                tags TEXT[],
                notes TEXT,
                status VARCHAR(50) DEFAULT 'active',
                owner_id INTEGER,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Companies table created');

        // Add company_id to crm_contacts
        console.log('📊 Adding company_id to crm_contacts...');
        await pool.query(`
            ALTER TABLE crm_contacts
            ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES crm_companies(id) ON DELETE SET NULL
        `);
        console.log('✅ company_id added to crm_contacts');

        // Add company_id to crm_communications
        console.log('📊 Adding company_id to crm_communications...');
        await pool.query(`
            ALTER TABLE crm_communications
            ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES crm_companies(id) ON DELETE CASCADE
        `);
        console.log('✅ company_id added to crm_communications');

        // Add company_id to crm_leads
        console.log('📊 Adding company_id to crm_leads...');
        await pool.query(`
            ALTER TABLE crm_leads
            ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES crm_companies(id) ON DELETE SET NULL
        `);
        console.log('✅ company_id added to crm_leads');

        // Create indexes
        console.log('📊 Creating indexes...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_crm_companies_name ON crm_companies(name);
            CREATE INDEX IF NOT EXISTS idx_crm_companies_industry ON crm_companies(industry);
            CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_id ON crm_contacts(company_id);
            CREATE INDEX IF NOT EXISTS idx_crm_communications_company_id ON crm_communications(company_id);
        `);
        console.log('✅ Indexes created');

        // Migrate existing company data from crm_contacts to crm_companies
        console.log('📊 Migrating existing company data...');
        await pool.query(`
            INSERT INTO crm_companies (name, created_at, updated_at)
            SELECT DISTINCT company, NOW(), NOW()
            FROM crm_contacts
            WHERE company IS NOT NULL
            AND company != ''
            AND NOT EXISTS (
                SELECT 1 FROM crm_companies WHERE name = crm_contacts.company
            )
        `);

        // Update contacts to link to companies
        await pool.query(`
            UPDATE crm_contacts
            SET company_id = crm_companies.id
            FROM crm_companies
            WHERE crm_contacts.company = crm_companies.name
            AND crm_contacts.company_id IS NULL
        `);
        console.log('✅ Existing company data migrated');

        console.log('🎉 Company migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error migrating companies:', err.message);
        console.error('Details:', err);
        process.exit(1);
    }
}

migrateCompanies();
