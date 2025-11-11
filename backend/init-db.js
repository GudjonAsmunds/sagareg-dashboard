const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDatabase() {
    console.log('🔧 Initializing database...');
    
    try {
        // Create tables
        console.log('📊 Creating tables...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS metrics (
                id SERIAL PRIMARY KEY,
                arr DECIMAL(12,2),
                customers INTEGER,
                runway_months INTEGER,
                team_size INTEGER,
                acv DECIMAL(12,2),
                growth_rate DECIMAL(5,2),
                churn_rate DECIMAL(5,2),
                monthly_burn DECIMAL(12,2),
                cac DECIMAL(12,2),
                ltv DECIMAL(12,2),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS deals (
                id SERIAL PRIMARY KEY,
                company VARCHAR(255) NOT NULL,
                contact VARCHAR(255),
                stage VARCHAR(50),
                value DECIMAL(12,2),
                probability INTEGER,
                notes TEXT,
                next_step TEXT,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS team_members (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(255),
                department VARCHAR(100),
                salary DECIMAL(12,2),
                equity DECIMAL(5,2),
                start_date DATE,
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS financial_projections (
                id SERIAL PRIMARY KEY,
                period VARCHAR(20),
                customers INTEGER,
                arr DECIMAL(12,2),
                revenue DECIMAL(12,2),
                costs DECIMAL(12,2),
                net_burn DECIMAL(12,2),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS hires (
                id SERIAL PRIMARY KEY,
                role VARCHAR(255) NOT NULL,
                priority VARCHAR(50),
                start_date VARCHAR(50),
                salary_range VARCHAR(100),
                equity VARCHAR(50),
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS investors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50),
                check_size VARCHAR(50),
                status VARCHAR(50),
                notes TEXT,
                contact VARCHAR(255),
                next_step TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS marketing_channels (
                id SERIAL PRIMARY KEY,
                channel VARCHAR(255) NOT NULL,
                monthly_budget DECIMAL(12,2),
                cpl DECIMAL(12,2),
                leads_per_month INTEGER,
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS roadmap_items (
                id SERIAL PRIMARY KEY,
                quarter VARCHAR(50) NOT NULL,
                focus VARCHAR(255),
                features TEXT,
                target_customers INTEGER,
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('✅ Tables created successfully');

        // Insert initial data
        console.log('📝 Inserting initial data...');
        
        // Check if data already exists
        const existingDeals = await pool.query('SELECT COUNT(*) FROM deals');
        
        if (existingDeals.rows[0].count == 0) {
            await pool.query(`
                INSERT INTO deals (company, contact, stage, value, probability, notes, next_step)
                VALUES 
                    ('Coripharma', 'Contact Name', 'Pilot', 200000, 80, 'Existing POC customer', 'Contract negotiation'),
                    ('Alvotech', 'Guðjón connection', 'Demo', 500000, 60, 'Biosimilars opportunity', 'Technical review'),
                    ('Alvogen', 'TBD', 'Discovery', 350000, 40, 'Generic drugs', 'Schedule demo')
            `);
            console.log('✅ Sample deals added');
        }

        const existingTeam = await pool.query('SELECT COUNT(*) FROM team_members');
        
        if (existingTeam.rows[0].count == 0) {
            await pool.query(`
                INSERT INTO team_members (name, role, department, salary, equity, start_date, status)
                VALUES 
                    ('Ómar Ingi Halldórsson', 'CEO', 'Executive', 100000, 31.5, '2024-11-01', 'hired'),
                    ('Guðjón Ásmundsson', 'CTO', 'Executive', 100000, 31.5, '2024-11-01', 'hired')
            `);
            console.log('✅ Team members added');
        }

        const existingHires = await pool.query('SELECT COUNT(*) FROM hires');

        if (existingHires.rows[0].count == 0) {
            await pool.query(`
                INSERT INTO hires (role, priority, start_date, salary_range, equity, status)
                VALUES
                    ('Senior Backend Engineer', 'Critical', 'Oct 1', '$140-160K', '0.5%', 'Recruiting'),
                    ('AI/ML Engineer', 'Critical', 'Oct 1', '$150-170K', '0.5%', 'Recruiting'),
                    ('VP Sales', 'Critical', 'Oct 15', '$150K + $150K OTE', '1.0%', 'Not Started'),
                    ('Frontend Engineer', 'High', 'Oct 15', '$130-150K', '0.4%', 'Not Started')
            `);
            console.log('✅ Priority hires added');
        }

        const existingInvestors = await pool.query('SELECT COUNT(*) FROM investors');

        if (existingInvestors.rows[0].count == 0) {
            await pool.query(`
                INSERT INTO investors (name, type, check_size, status, notes, contact, next_step)
                VALUES
                    ('Lux Capital', 'Lead', '$3-4M', 'Not Contacted', 'Deep tech focus', 'Josh Wolfe', 'Warm intro via Sarfaraz'),
                    ('a16z Bio', 'Lead', '$3-4M', 'Not Contacted', 'Bio + AI intersection', 'Vijay Pande', 'Schedule intro call'),
                    ('Northzone', 'Follow', '$1-2M', 'Not Contacted', 'Nordic connection', 'Pär-Jörgen Pärson', 'Nordic connection')
            `);
            console.log('✅ Investor pipeline added');
        }

        const existingChannels = await pool.query('SELECT COUNT(*) FROM marketing_channels');

        if (existingChannels.rows[0].count == 0) {
            await pool.query(`
                INSERT INTO marketing_channels (channel, monthly_budget, cpl, leads_per_month, status)
                VALUES
                    ('LinkedIn Ads', 5000, 50, 100, 'Not Started'),
                    ('Google Ads', 8000, 80, 100, 'Not Started'),
                    ('Content Marketing', 3000, 30, 100, 'Not Started'),
                    ('Events (CPHI)', 4000, 100, 40, 'Booked')
            `);
            console.log('✅ Marketing channels added');
        }

        const existingRoadmap = await pool.query('SELECT COUNT(*) FROM roadmap_items');

        if (existingRoadmap.rows[0].count == 0) {
            await pool.query(`
                INSERT INTO roadmap_items (quarter, focus, features, target_customers, status)
                VALUES
                    ('Q1 2026', 'FDA Module', 'FDA templates, Module 2 support, API launch', 10, 'Planned'),
                    ('Q2 2026', 'Intelligence', 'Change tracking, Predictive detection, Multi-language', 20, 'Planned'),
                    ('Q3 2026', 'Platform', 'Partner API, Marketplace, Veeva integration', 35, 'Planned'),
                    ('Q4 2026', 'Enterprise', 'SSO/SAML, Advanced permissions, White-label', 50, 'Planned')
            `);
            console.log('✅ Roadmap items added');
        }

        console.log('🎉 Database initialization complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error initializing database:', err.message);
        console.error('Details:', err);
        process.exit(1);
    }
}

initDatabase();
