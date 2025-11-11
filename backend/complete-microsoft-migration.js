const { Pool } = require('pg');
require('dotenv').config();

async function completeMicrosoftMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🚀 Completing Microsoft Integration Migration...\n');

        // Check what columns exist in crm_companies
        const companyColumns = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'crm_companies'
        `);

        console.log('📊 Available company columns:', companyColumns.rows.map(r => r.column_name).join(', '));

        // Create view with available columns
        console.log('\n👁️ Creating enhanced contact view...');
        await pool.query(`
            CREATE OR REPLACE VIEW crm_contact_microsoft_view AS
            SELECT
                c.*,
                comp.name as company_name,
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
            GROUP BY c.id, comp.id, comp.name
        `);
        console.log('✅ Enhanced contact view created');

        // Create Microsoft integration settings table if not exists
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

        // Show all Microsoft tables
        const msTables = await pool.query(`
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND (table_name LIKE 'microsoft_%' OR table_name LIKE '%microsoft%')
            ORDER BY table_name
        `);

        console.log('📊 Microsoft Integration Database Objects:');
        msTables.rows.forEach(row => {
            console.log(`  ✅ ${row.table_name} (${row.table_type})`);
        });

        // Verify indexes
        const indexes = await pool.query(`
            SELECT indexname
            FROM pg_indexes
            WHERE tablename LIKE 'microsoft_%'
        `);

        console.log('\n🔍 Indexes created:');
        indexes.rows.forEach(row => {
            console.log(`  ✅ ${row.indexname}`);
        });

        console.log('\n✨ Migration complete! Your database is ready for Microsoft integration.');

    } catch (error) {
        console.error('❌ Error:', error.message);

        // If it's a duplicate error, that's ok
        if (error.code === '42P07' || error.code === '42701') {
            console.log('ℹ️  Some objects already exist, that\'s OK!');
        } else {
            console.error('\nError details:', error);
            process.exit(1);
        }
    } finally {
        await pool.end();
    }
}

completeMicrosoftMigration();