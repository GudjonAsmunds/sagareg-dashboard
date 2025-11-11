const { Pool } = require('pg');
require('dotenv').config();

async function setupAuth() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔐 Setting up Authentication System...\n');

        // Add password and last_login columns to users table
        console.log('📝 Updating users table for authentication...');

        try {
            await pool.query(`
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS password VARCHAR(255)
            `);
            console.log('✅ Added password column');
        } catch (error) {
            if (error.code === '42701') {
                console.log('ℹ️  password column already exists');
            } else throw error;
        }

        try {
            await pool.query(`
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
            `);
            console.log('✅ Added last_login column');
        } catch (error) {
            if (error.code === '42701') {
                console.log('ℹ️  last_login column already exists');
            } else throw error;
        }

        // Create a default admin user if no users exist
        const userCount = await pool.query('SELECT COUNT(*) FROM users WHERE email = $1', ['admin@sagareg.com']);

        if (userCount.rows[0].count === '0') {
            console.log('\n📝 Creating default admin user...');

            // Hash password for admin@sagareg.com / admin123
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);

            await pool.query(`
                INSERT INTO users (email, password, name, created_at, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, ['admin@sagareg.com', hashedPassword, 'Admin User']);

            console.log('✅ Default admin user created');
            console.log('   Email: admin@sagareg.com');
            console.log('   Password: admin123');
            console.log('   ⚠️  IMPORTANT: Change this password after first login!');
        }

        // Verify the setup
        console.log('\n🔍 Verifying authentication setup...');
        const columns = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'users'
            ORDER BY ordinal_position
        `);

        console.log('\n📊 Users table structure:');
        columns.rows.forEach(col => {
            console.log(`  ✅ ${col.column_name} (${col.data_type})`);
        });

        console.log('\n🎉 Authentication System Setup Complete!');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('\n✨ Database connection closed');
    }
}

setupAuth();