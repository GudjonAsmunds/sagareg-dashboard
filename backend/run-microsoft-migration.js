const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Running Microsoft integration database migrations...\n');

        // Read the migration SQL file
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', 'add-microsoft-integration.sql'),
            'utf8'
        );

        // Split the SQL into individual statements (by semicolon)
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.substring(0, 50) + '...');
                await pool.query(statement + ';');
            }
        }

        console.log('\n✅ Microsoft integration migrations completed successfully!');

        // Verify the tables were created
        const tables = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('documents', 'email_history')
        `);

        console.log('\n📋 Created tables:');
        tables.rows.forEach(row => {
            console.log('  - ' + row.table_name);
        });

        // Check if user columns were added
        const userColumns = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN ('microsoft_id', 'microsoft_email', 'microsoft_refresh_token')
        `);

        if (userColumns.rows.length > 0) {
            console.log('\n📋 Added columns to users table:');
            userColumns.rows.forEach(row => {
                console.log('  - ' + row.column_name);
            });
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();