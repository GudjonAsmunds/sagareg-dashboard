const { Pool } = require('pg');
require('dotenv').config();

async function runMicrosoftMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🚀 Starting Microsoft Integration Migration...\n');

        // Step 1: Add Microsoft fields to users table
        console.log('📝 Updating users table...');

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS microsoft_id VARCHAR(255) UNIQUE
        `);

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS microsoft_email VARCHAR(255)
        `);

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS microsoft_refresh_token TEXT
        `);

        console.log('✅ Users table updated with Microsoft fields');

        // Step 2: Create microsoft_documents table (separate from existing crm_documents)
        console.log('\n📝 Creating microsoft_documents table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS microsoft_documents (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER REFERENCES crm_contacts(id) ON DELETE CASCADE,
                company_id INTEGER REFERENCES crm_companies(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                file_type VARCHAR(50),
                file_size INTEGER,
                teams_file_id VARCHAR(255) UNIQUE,
                teams_web_url TEXT,
                teams_folder_path TEXT,
                uploaded_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Microsoft documents table created');

        // Step 3: Create microsoft_email_history table
        console.log('\n📝 Creating microsoft_email_history table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS microsoft_email_history (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER REFERENCES crm_contacts(id) ON DELETE CASCADE,
                sender_id INTEGER REFERENCES users(id),
                subject VARCHAR(500),
                body TEXT,
                recipients TEXT[],
                cc_recipients TEXT[],
                bcc_recipients TEXT[],
                microsoft_message_id VARCHAR(255),
                sent_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Microsoft email history table created');

        // Step 4: Create indexes
        console.log('\n🔧 Creating indexes...');

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_ms_documents_contact
            ON microsoft_documents(contact_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_ms_documents_company
            ON microsoft_documents(company_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_ms_email_history_contact
            ON microsoft_email_history(contact_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_ms_email_history_sender
            ON microsoft_email_history(sender_id)
        `);

        console.log('✅ Indexes created');

        // Step 5: Create enhanced contact view with Microsoft data
        console.log('\n👁️ Creating enhanced contact view...');
        await pool.query(`
            CREATE OR REPLACE VIEW crm_contact_microsoft_view AS
            SELECT
                c.*,
                comp.name as company_name,
                comp.industry,
                comp.size,
                COUNT(DISTINCT md.id) as microsoft_document_count,
                COUNT(DISTINCT meh.id) as microsoft_email_count,
                COUNT(DISTINCT cd.id) as crm_document_count,
                MAX(md.created_at) as last_document_upload,
                MAX(meh.sent_at) as last_email_sent
            FROM crm_contacts c
            LEFT JOIN crm_companies comp ON c.company_id = comp.id
            LEFT JOIN microsoft_documents md ON md.contact_id = c.id
            LEFT JOIN microsoft_email_history meh ON meh.contact_id = c.id
            LEFT JOIN crm_documents cd ON cd.contact_id = c.id
            GROUP BY c.id, comp.id, comp.name, comp.industry, comp.size
        `);
        console.log('✅ Enhanced contact view created');

        // Step 6: Add Microsoft integration settings table
        console.log('\n📝 Creating Microsoft integration settings table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS microsoft_integration_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) UNIQUE,
                sync_enabled BOOLEAN DEFAULT true,
                auto_file_contacts BOOLEAN DEFAULT true,
                default_folder_structure VARCHAR(255) DEFAULT 'Companies/{company}/Contacts/{contact}',
                last_sync_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Microsoft integration settings table created');

        console.log('\n🎉 Microsoft Integration Migration Completed Successfully!\n');

        // Show summary
        const summary = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM information_schema.tables
                 WHERE table_schema = 'public'
                 AND table_name LIKE 'microsoft_%') as ms_tables,
                (SELECT COUNT(*) FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'users'
                 AND column_name LIKE 'microsoft_%') as ms_user_columns
        `);

        console.log('📊 Migration Summary:');
        console.log(`  ✅ Microsoft tables created: ${summary.rows[0].ms_tables}`);
        console.log(`  ✅ Microsoft user columns added: ${summary.rows[0].ms_user_columns}`);
        console.log('\n🔗 Integration Tables:');
        console.log('  • microsoft_documents - Store Teams/SharePoint document references');
        console.log('  • microsoft_email_history - Track emails sent via Outlook');
        console.log('  • microsoft_integration_settings - User preferences for integration');
        console.log('  • crm_contact_microsoft_view - Combined view of contacts with MS data');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);

        // If it's a duplicate column error, that's ok
        if (error.code === '42701') {
            console.log('ℹ️  Some columns already exist, continuing...');
        } else {
            console.error('\nError details:', error);
            process.exit(1);
        }
    } finally {
        await pool.end();
        console.log('\n✨ Database connection closed');
    }
}

runMicrosoftMigration();