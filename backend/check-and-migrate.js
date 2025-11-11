const { Pool } = require('pg');
require('dotenv').config();

async function checkAndMigrate() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔍 Checking existing database structure...\n');

        // Check existing tables
        const tables = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('Existing tables:');
        tables.rows.forEach(row => {
            console.log('  - ' + row.table_name);
        });

        // Check if we have a users table or need to create one
        const hasUsers = tables.rows.some(row => row.table_name === 'users');

        if (!hasUsers) {
            console.log('\n📝 Creating users table...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255),
                    password VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Users table created');
        }

        // Now add Microsoft fields to users table
        console.log('\n🔄 Adding Microsoft integration fields...');

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

        console.log('✅ Microsoft fields added to users table');

        // Create documents table
        console.log('\n📝 Creating documents table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
                company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
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
        console.log('✅ Documents table created');

        // Create email_history table
        console.log('\n📝 Creating email_history table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS email_history (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
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
        console.log('✅ Email history table created');

        // Create indexes
        console.log('\n🔧 Creating indexes...');

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_documents_contact
            ON documents(contact_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_documents_company
            ON documents(company_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_email_history_contact
            ON email_history(contact_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_email_history_sender
            ON email_history(sender_id)
        `);

        console.log('✅ Indexes created');

        // Create or update the view
        console.log('\n👁️ Creating contact_details view...');
        await pool.query(`
            CREATE OR REPLACE VIEW contact_details AS
            SELECT
                c.*,
                comp.name as company_name,
                COUNT(DISTINCT d.id) as document_count,
                COUNT(DISTINCT e.id) as email_count
            FROM contacts c
            LEFT JOIN companies comp ON c.company_id = comp.id
            LEFT JOIN documents d ON d.contact_id = c.id
            LEFT JOIN email_history e ON e.contact_id = c.id
            GROUP BY c.id, comp.id, comp.name
        `);
        console.log('✅ Contact details view created');

        console.log('\n🎉 Microsoft integration migration completed successfully!');

        // Show final structure
        const finalTables = await pool.query(`
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('users', 'documents', 'email_history', 'contact_details')
            ORDER BY table_name
        `);

        console.log('\n📊 Microsoft Integration Database Objects:');
        finalTables.rows.forEach(row => {
            console.log(`  - ${row.table_name} (${row.table_type})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

checkAndMigrate();