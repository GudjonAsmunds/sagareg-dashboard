const { Pool } = require('pg');
require('dotenv').config();

// Connect to postgres default database as admin to create database and user
async function setupDatabase() {
    console.log('🔧 Setting up Azure PostgreSQL database...\n');

    // You need to provide your Azure admin credentials
    const adminUsername = process.env.AZURE_ADMIN_USER || 'your_admin_user';
    const adminPassword = process.env.AZURE_ADMIN_PASSWORD || 'your_admin_password';
    const serverHost = 'sagaplatform-postgres.postgres.database.azure.com';

    console.log('📋 Admin user:', adminUsername);
    console.log('📋 Server:', serverHost);
    console.log('');

    const adminPool = new Pool({
        host: serverHost,
        port: 5432,
        user: adminUsername,
        password: adminPassword,
        database: 'postgres', // Connect to default postgres database
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔌 Connecting to Azure PostgreSQL as admin...');
        await adminPool.query('SELECT version()');
        console.log('✅ Connected successfully\n');

        // Check if database exists
        console.log('🔍 Checking if database "sagareg" exists...');
        const dbCheck = await adminPool.query(
            `SELECT 1 FROM pg_database WHERE datname = 'sagareg'`
        );

        if (dbCheck.rows.length === 0) {
            console.log('📦 Creating database "sagareg"...');
            await adminPool.query('CREATE DATABASE sagareg');
            console.log('✅ Database created\n');
        } else {
            console.log('✅ Database already exists\n');
        }

        // Check if user exists
        console.log('🔍 Checking if user "sagareg_user" exists...');
        const userCheck = await adminPool.query(
            `SELECT 1 FROM pg_roles WHERE rolname = 'sagareg_user'`
        );

        if (userCheck.rows.length === 0) {
            console.log('👤 Creating user "sagareg_user"...');
            await adminPool.query(`CREATE USER sagareg_user WITH PASSWORD 'admin123'`);
            console.log('✅ User created\n');
        } else {
            console.log('✅ User already exists\n');
            console.log('🔄 Updating password...');
            await adminPool.query(`ALTER USER sagareg_user WITH PASSWORD 'admin123'`);
            console.log('✅ Password updated\n');
        }

        // Grant privileges
        console.log('🔐 Granting privileges...');
        await adminPool.query('GRANT ALL PRIVILEGES ON DATABASE sagareg TO sagareg_user');
        console.log('✅ Privileges granted\n');

        await adminPool.end();

        // Now connect to the new database and grant schema privileges
        console.log('🔌 Connecting to "sagareg" database to set up schema permissions...');
        const sagaregPool = new Pool({
            host: serverHost,
            port: 5432,
            user: adminUsername,
            password: adminPassword,
            database: 'sagareg',
            ssl: { rejectUnauthorized: false }
        });

        await sagaregPool.query('GRANT ALL ON SCHEMA public TO sagareg_user');
        await sagaregPool.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sagareg_user');
        await sagaregPool.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sagareg_user');
        await sagaregPool.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sagareg_user');
        await sagaregPool.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sagareg_user');

        console.log('✅ Schema permissions granted\n');

        await sagaregPool.end();

        console.log('🎉 Database setup complete!');
        console.log('\nNext step: Run "npm run init-db" to create tables and populate initial data\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error setting up database:', err.message);
        console.error('\nDetails:', err);
        process.exit(1);
    }
}

setupDatabase();