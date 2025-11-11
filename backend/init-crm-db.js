const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initCRMDatabase() {
    console.log('🔧 Initializing CRM database tables...');

    try {
        // Create CRM Contacts table
        console.log('📊 Creating CRM contacts table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS crm_contacts (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                full_name VARCHAR(255),
                company VARCHAR(255),
                job_title VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                mobile VARCHAR(50),
                website VARCHAR(255),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                country VARCHAR(100),
                postal_code VARCHAR(20),
                linkedin_url VARCHAR(255),
                source VARCHAR(50) DEFAULT 'manual',
                tags TEXT[],
                notes TEXT,
                status VARCHAR(50) DEFAULT 'active',
                owner_id INTEGER,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ CRM contacts table created');

        // Create CRM Leads table
        console.log('📊 Creating CRM leads table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS crm_leads (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER REFERENCES crm_contacts(id) ON DELETE SET NULL,
                company VARCHAR(255) NOT NULL,
                contact_name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                status VARCHAR(50) DEFAULT 'new',
                stage VARCHAR(50) DEFAULT 'prospecting',
                value DECIMAL(12,2),
                probability INTEGER DEFAULT 0,
                source VARCHAR(100),
                industry VARCHAR(100),
                employees VARCHAR(50),
                revenue_range VARCHAR(50),
                interest_level VARCHAR(50),
                notes TEXT,
                next_action TEXT,
                next_action_date DATE,
                assigned_to VARCHAR(255),
                tags TEXT[],
                converted_to_deal BOOLEAN DEFAULT FALSE,
                deal_id INTEGER,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ CRM leads table created');

        // Create CRM Communications/Activities table
        console.log('📊 Creating CRM communications table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS crm_communications (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER REFERENCES crm_contacts(id) ON DELETE CASCADE,
                lead_id INTEGER REFERENCES crm_leads(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                subject VARCHAR(255),
                description TEXT,
                date TIMESTAMP DEFAULT NOW(),
                duration_minutes INTEGER,
                outcome VARCHAR(100),
                follow_up_required BOOLEAN DEFAULT FALSE,
                follow_up_date DATE,
                created_by VARCHAR(255),
                attachments TEXT[],
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ CRM communications table created');

        // Create indexes for better performance
        console.log('📊 Creating indexes...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
            CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON crm_contacts(company);
            CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
            CREATE INDEX IF NOT EXISTS idx_crm_leads_contact_id ON crm_leads(contact_id);
            CREATE INDEX IF NOT EXISTS idx_crm_communications_contact_id ON crm_communications(contact_id);
            CREATE INDEX IF NOT EXISTS idx_crm_communications_lead_id ON crm_communications(lead_id);
        `);
        console.log('✅ Indexes created');

        console.log('🎉 CRM database initialization complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error initializing CRM database:', err.message);
        console.error('Details:', err);
        process.exit(1);
    }
}

initCRMDatabase();
