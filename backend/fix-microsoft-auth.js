const { Pool } = require('pg');
require('dotenv').config();

async function fixMicrosoftAuth() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔧 Fixing Microsoft Authentication Setup...\n');

        // Step 1: Create users table if it doesn't exist
        console.log('📝 Creating users table if not exists...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table ready');

        // Step 2: Add Microsoft fields to users table
        console.log('\n📝 Adding Microsoft fields to users table...');

        try {
            await pool.query(`
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS microsoft_id VARCHAR(255) UNIQUE
            `);
            console.log('✅ Added microsoft_id column');
        } catch (error) {
            if (error.code === '42701') {
                console.log('ℹ️  microsoft_id column already exists');
            } else throw error;
        }

        try {
            await pool.query(`
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS microsoft_email VARCHAR(255)
            `);
            console.log('✅ Added microsoft_email column');
        } catch (error) {
            if (error.code === '42701') {
                console.log('ℹ️  microsoft_email column already exists');
            } else throw error;
        }

        try {
            await pool.query(`
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS microsoft_refresh_token TEXT
            `);
            console.log('✅ Added microsoft_refresh_token column');
        } catch (error) {
            if (error.code === '42701') {
                console.log('ℹ️  microsoft_refresh_token column already exists');
            } else throw error;
        }

        // Step 3: Create microsoft_documents table
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

        // Step 4: Create microsoft_email_history table
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

        // Step 5: Create indexes
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

        // Step 6: Check if tables were created successfully
        console.log('\n🔍 Verifying setup...');

        const tableCheck = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('users', 'microsoft_documents', 'microsoft_email_history')
            ORDER BY table_name
        `);

        console.log('\n📊 Tables verified:');
        tableCheck.rows.forEach(row => {
            console.log(`  ✅ ${row.table_name}`);
        });

        const userColumns = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name LIKE 'microsoft_%'
            ORDER BY column_name
        `);

        console.log('\n📊 Microsoft columns in users table:');
        userColumns.rows.forEach(row => {
            console.log(`  ✅ ${row.column_name}`);
        });

        console.log('\n🎉 Microsoft Authentication Setup Complete!');
        console.log('\n📌 Next Steps:');
        console.log('1. Click "Connect Microsoft Account" button in the app');
        console.log('2. Log in with your Microsoft account');
        console.log('3. You will be redirected back to the app');
        console.log('4. Your documents and email features will then work');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('\n✨ Database connection closed');
    }
}

fixMicrosoftAuth();