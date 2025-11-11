const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const multer = require('multer');
const { scanBusinessCard } = require('./services/businessCardScanner');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads (in-memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
        console.log('Make sure PostgreSQL is running and database exists');
    } else {
        console.log('✅ Database connected successfully at:', res.rows[0].now);
    }
});

// ============ API ROUTES ============

// Authentication Routes - MUST be first!
const { router: authRoutes, authenticateToken } = require('./routes/auth-routes');
app.use('/api/auth', authRoutes);

// Microsoft Integration Routes
const microsoftRoutes = require('./routes/microsoft-routes');
app.use('/api/microsoft', microsoftRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Dashboard Metrics
app.get('/api/metrics', async (req, res) => {
    try {
        const metrics = await pool.query('SELECT * FROM metrics ORDER BY created_at DESC LIMIT 1');
        const deals = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(value), 0) as total FROM deals WHERE status != \'lost\'');
        const team = await pool.query('SELECT COUNT(*) as count FROM team_members WHERE status = \'hired\'');
        
        res.json({
            metrics: metrics.rows[0] || {},
            deals: deals.rows[0],
            team: team.rows[0]
        });
    } catch (err) {
        console.error('Error fetching metrics:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/metrics', async (req, res) => {
    try {
        const {
            arr, customers, runway_months, team_size, acv, growth_rate,
            churn_rate, monthly_burn, cac, ltv
        } = req.body;
        
        const result = await pool.query(
            `INSERT INTO metrics 
             (arr, customers, runway_months, team_size, acv, growth_rate, churn_rate, monthly_burn, cac, ltv)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [arr, customers, runway_months, team_size, acv, growth_rate, churn_rate, monthly_burn, cac, ltv]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error saving metrics:', err);
        res.status(500).json({ error: err.message });
    }
});

// Sales Pipeline - Deals
app.get('/api/deals', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM deals ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching deals:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/deals', async (req, res) => {
    try {
        const { company, contact, stage, value, probability, notes, next_step } = req.body;
        const result = await pool.query(
            `INSERT INTO deals (company, contact, stage, value, probability, notes, next_step, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') RETURNING *`,
            [company, contact, stage, value, probability, notes, next_step]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating deal:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/deals/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { company, contact, stage, value, probability, notes, next_step, status } = req.body;
        const result = await pool.query(
            `UPDATE deals 
             SET company = $1, contact = $2, stage = $3, value = $4, probability = $5, 
                 notes = $6, next_step = $7, status = $8, updated_at = NOW()
             WHERE id = $9 RETURNING *`,
            [company, contact, stage, value, probability, notes, next_step, status || 'active', id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating deal:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/deals/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM deals WHERE id = $1', [id]);
        res.json({ message: 'Deal deleted successfully' });
    } catch (err) {
        console.error('Error deleting deal:', err);
        res.status(500).json({ error: err.message });
    }
});

// Team Members
app.get('/api/team', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM team_members ORDER BY start_date');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching team:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/team', async (req, res) => {
    try {
        const { name, role, department, salary, equity, start_date, status } = req.body;
        const result = await pool.query(
            `INSERT INTO team_members (name, role, department, salary, equity, start_date, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, role, department, salary, equity, start_date, status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating team member:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/team/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, department, salary, equity, start_date, status } = req.body;
        const result = await pool.query(
            `UPDATE team_members 
             SET name = $1, role = $2, department = $3, salary = $4, equity = $5, 
                 start_date = $6, status = $7, updated_at = NOW()
             WHERE id = $8 RETURNING *`,
            [name, role, department, salary, equity, start_date, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating team member:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/team/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM team_members WHERE id = $1', [id]);
        res.json({ message: 'Team member deleted successfully' });
    } catch (err) {
        console.error('Error deleting team member:', err);
        res.status(500).json({ error: err.message });
    }
});

// Hires
app.get('/api/hires', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM hires ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching hires:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/hires', async (req, res) => {
    try {
        const { role, priority, start_date, salary_range, equity, status } = req.body;
        const result = await pool.query(
            `INSERT INTO hires (role, priority, start_date, salary_range, equity, status)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [role, priority, start_date, salary_range, equity, status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating hire:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/hires/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role, priority, start_date, salary_range, equity, status } = req.body;
        const result = await pool.query(
            `UPDATE hires
             SET role = $1, priority = $2, start_date = $3, salary_range = $4,
                 equity = $5, status = $6, updated_at = NOW()
             WHERE id = $7 RETURNING *`,
            [role, priority, start_date, salary_range, equity, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating hire:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/hires/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM hires WHERE id = $1', [id]);
        res.json({ message: 'Hire deleted successfully' });
    } catch (err) {
        console.error('Error deleting hire:', err);
        res.status(500).json({ error: err.message });
    }
});

// Investors
app.get('/api/investors', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM investors ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching investors:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/investors', async (req, res) => {
    try {
        const { name, type, check_size, status, notes, contact, next_step } = req.body;
        const result = await pool.query(
            `INSERT INTO investors (name, type, check_size, status, notes, contact, next_step)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, type, check_size, status, notes, contact, next_step]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating investor:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/investors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, check_size, status, notes, contact, next_step } = req.body;
        const result = await pool.query(
            `UPDATE investors
             SET name = $1, type = $2, check_size = $3, status = $4,
                 notes = $5, contact = $6, next_step = $7, updated_at = NOW()
             WHERE id = $8 RETURNING *`,
            [name, type, check_size, status, notes, contact, next_step, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating investor:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/investors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM investors WHERE id = $1', [id]);
        res.json({ message: 'Investor deleted successfully' });
    } catch (err) {
        console.error('Error deleting investor:', err);
        res.status(500).json({ error: err.message });
    }
});

// Financial Projections
app.get('/api/projections', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM financial_projections ORDER BY period');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching projections:', err);
        res.status(500).json({ error: err.message });
    }
});

// Marketing Channels
app.get('/api/marketing-channels', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM marketing_channels ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching marketing channels:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/marketing-channels', async (req, res) => {
    try {
        const { channel, monthly_budget, cpl, leads_per_month, status } = req.body;
        const result = await pool.query(
            `INSERT INTO marketing_channels (channel, monthly_budget, cpl, leads_per_month, status)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [channel, monthly_budget, cpl, leads_per_month, status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating marketing channel:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/marketing-channels/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { channel, monthly_budget, cpl, leads_per_month, status } = req.body;
        const result = await pool.query(
            `UPDATE marketing_channels
             SET channel = $1, monthly_budget = $2, cpl = $3, leads_per_month = $4,
                 status = $5, updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [channel, monthly_budget, cpl, leads_per_month, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating marketing channel:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/marketing-channels/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM marketing_channels WHERE id = $1', [id]);
        res.json({ message: 'Marketing channel deleted successfully' });
    } catch (err) {
        console.error('Error deleting marketing channel:', err);
        res.status(500).json({ error: err.message });
    }
});

// Roadmap Items
app.get('/api/roadmap', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roadmap_items ORDER BY created_at ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching roadmap:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/roadmap', async (req, res) => {
    try {
        const { quarter, focus, features, target_customers, status } = req.body;
        const result = await pool.query(
            `INSERT INTO roadmap_items (quarter, focus, features, target_customers, status)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [quarter, focus, features, target_customers, status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating roadmap item:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/roadmap/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { quarter, focus, features, target_customers, status } = req.body;
        const result = await pool.query(
            `UPDATE roadmap_items
             SET quarter = $1, focus = $2, features = $3, target_customers = $4,
                 status = $5, updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [quarter, focus, features, target_customers, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating roadmap item:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/roadmap/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM roadmap_items WHERE id = $1', [id]);
        res.json({ message: 'Roadmap item deleted successfully' });
    } catch (err) {
        console.error('Error deleting roadmap item:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============ CRM MODULE ============

// CRM Companies
app.get('/api/crm/companies', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*,
                    (SELECT COUNT(*) FROM crm_contacts WHERE company_id = c.id) as contact_count,
                    (SELECT COUNT(*) FROM crm_leads WHERE company_id = c.id) as lead_count
             FROM crm_companies c
             ORDER BY c.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching companies:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/crm/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM crm_companies WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching company:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/crm/companies', async (req, res) => {
    try {
        const {
            name, industry, website, phone, email, address, city, state,
            country, postal_code, employee_count, revenue_range, linkedin_url,
            description, tags, notes, status
        } = req.body;

        const result = await pool.query(
            `INSERT INTO crm_companies (
                name, industry, website, phone, email, address, city, state,
                country, postal_code, employee_count, revenue_range, linkedin_url,
                description, tags, notes, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *`,
            [
                name, industry, website, phone, email, address, city, state,
                country, postal_code, employee_count, revenue_range, linkedin_url,
                description, tags, notes, status || 'active'
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating company:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/crm/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, industry, website, phone, email, address, city, state,
            country, postal_code, employee_count, revenue_range, linkedin_url,
            description, tags, notes, status
        } = req.body;

        const result = await pool.query(
            `UPDATE crm_companies SET
                name = $1, industry = $2, website = $3, phone = $4, email = $5,
                address = $6, city = $7, state = $8, country = $9, postal_code = $10,
                employee_count = $11, revenue_range = $12, linkedin_url = $13,
                description = $14, tags = $15, notes = $16, status = $17,
                updated_at = NOW()
            WHERE id = $18 RETURNING *`,
            [
                name, industry, website, phone, email, address, city, state,
                country, postal_code, employee_count, revenue_range, linkedin_url,
                description, tags, notes, status, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating company:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/crm/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM crm_companies WHERE id = $1', [id]);
        res.json({ message: 'Company deleted successfully' });
    } catch (err) {
        console.error('Error deleting company:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get contacts for a specific company
app.get('/api/crm/companies/:id/contacts', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM crm_contacts WHERE company_id = $1 ORDER BY created_at DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching company contacts:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get communications for a specific company
app.get('/api/crm/companies/:id/communications', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM crm_communications WHERE company_id = $1 ORDER BY date DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching company communications:', err);
        res.status(500).json({ error: err.message });
    }
});

// Business Card Scanning
app.post('/api/crm/scan-business-card', upload.single('card'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('📸 Processing business card scan...');
        const result = await scanBusinessCard(req.file.buffer);

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json(result);
    } catch (err) {
        console.error('Error scanning business card:', err);
        res.status(500).json({ error: err.message });
    }
});

// CRM Contacts
app.get('/api/crm/contacts', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*, comp.name as company_name
             FROM crm_contacts c
             LEFT JOIN crm_companies comp ON c.company_id = comp.id
             ORDER BY c.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/crm/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM crm_contacts WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching contact:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/crm/contacts', async (req, res) => {
    try {
        const {
            first_name, last_name, full_name, company, company_id, job_title, email, phone,
            mobile, website, address, city, state, country, postal_code,
            linkedin_url, source, tags, notes, status
        } = req.body;

        let finalCompanyId = company_id;

        // If company name is provided but company_id is not, check if company exists or create it
        if (company && !company_id) {
            // Check if company already exists (case-insensitive)
            const companyCheck = await pool.query(
                'SELECT id FROM crm_companies WHERE LOWER(name) = LOWER($1)',
                [company]
            );

            if (companyCheck.rows.length > 0) {
                // Company exists, use its ID
                finalCompanyId = companyCheck.rows[0].id;
                console.log(`📎 Using existing company: ${company} (ID: ${finalCompanyId})`);
            } else {
                // Company doesn't exist, create it
                const newCompany = await pool.query(
                    'INSERT INTO crm_companies (name, status) VALUES ($1, $2) RETURNING id',
                    [company, 'active']
                );
                finalCompanyId = newCompany.rows[0].id;
                console.log(`🏢 Created new company: ${company} (ID: ${finalCompanyId})`);
            }
        }

        const result = await pool.query(
            `INSERT INTO crm_contacts (
                first_name, last_name, full_name, company, company_id, job_title, email, phone,
                mobile, website, address, city, state, country, postal_code,
                linkedin_url, source, tags, notes, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING *`,
            [
                first_name, last_name, full_name, company, finalCompanyId, job_title, email, phone,
                mobile, website, address, city, state, country, postal_code,
                linkedin_url, source || 'manual', tags, notes, status || 'active'
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating contact:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/crm/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name, last_name, full_name, company, company_id, job_title, email, phone,
            mobile, website, address, city, state, country, postal_code,
            linkedin_url, tags, notes, status
        } = req.body;

        const result = await pool.query(
            `UPDATE crm_contacts SET
                first_name = $1, last_name = $2, full_name = $3, company = $4, company_id = $5,
                job_title = $6, email = $7, phone = $8, mobile = $9, website = $10,
                address = $11, city = $12, state = $13, country = $14, postal_code = $15,
                linkedin_url = $16, tags = $17, notes = $18, status = $19,
                updated_at = NOW()
            WHERE id = $20 RETURNING *`,
            [
                first_name, last_name, full_name, company, company_id, job_title, email, phone,
                mobile, website, address, city, state, country, postal_code,
                linkedin_url, tags, notes, status, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating contact:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/crm/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM crm_contacts WHERE id = $1', [id]);
        res.json({ message: 'Contact deleted successfully' });
    } catch (err) {
        console.error('Error deleting contact:', err);
        res.status(500).json({ error: err.message });
    }
});

// CRM Leads
app.get('/api/crm/leads', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT l.*, c.full_name as contact_full_name, c.email as contact_email
             FROM crm_leads l
             LEFT JOIN crm_contacts c ON l.contact_id = c.id
             ORDER BY l.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching leads:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/crm/leads/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT l.*, c.full_name as contact_full_name
             FROM crm_leads l
             LEFT JOIN crm_contacts c ON l.contact_id = c.id
             WHERE l.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching lead:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/crm/leads', async (req, res) => {
    try {
        const {
            contact_id, company, contact_name, email, phone, status, stage, value,
            probability, source, industry, employees, revenue_range, interest_level,
            notes, next_action, next_action_date, assigned_to, tags
        } = req.body;

        const result = await pool.query(
            `INSERT INTO crm_leads (
                contact_id, company, contact_name, email, phone, status, stage, value,
                probability, source, industry, employees, revenue_range, interest_level,
                notes, next_action, next_action_date, assigned_to, tags
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *`,
            [
                contact_id, company, contact_name, email, phone, status || 'new',
                stage || 'prospecting', value, probability || 0, source, industry,
                employees, revenue_range, interest_level, notes, next_action,
                next_action_date, assigned_to, tags
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating lead:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/crm/leads/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            contact_id, company, contact_name, email, phone, status, stage, value,
            probability, source, industry, employees, revenue_range, interest_level,
            notes, next_action, next_action_date, assigned_to, tags
        } = req.body;

        const result = await pool.query(
            `UPDATE crm_leads SET
                contact_id = $1, company = $2, contact_name = $3, email = $4, phone = $5,
                status = $6, stage = $7, value = $8, probability = $9, source = $10,
                industry = $11, employees = $12, revenue_range = $13, interest_level = $14,
                notes = $15, next_action = $16, next_action_date = $17, assigned_to = $18,
                tags = $19, updated_at = NOW()
            WHERE id = $20 RETURNING *`,
            [
                contact_id, company, contact_name, email, phone, status, stage, value,
                probability, source, industry, employees, revenue_range, interest_level,
                notes, next_action, next_action_date, assigned_to, tags, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating lead:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/crm/leads/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM crm_leads WHERE id = $1', [id]);
        res.json({ message: 'Lead deleted successfully' });
    } catch (err) {
        console.error('Error deleting lead:', err);
        res.status(500).json({ error: err.message });
    }
});

// CRM Communications/Activities
app.get('/api/crm/communications', async (req, res) => {
    try {
        const { contact_id, lead_id, company_id } = req.query;
        let query = 'SELECT * FROM crm_communications';
        let params = [];

        if (contact_id) {
            query += ' WHERE contact_id = $1';
            params.push(contact_id);
        } else if (lead_id) {
            query += ' WHERE lead_id = $1';
            params.push(lead_id);
        } else if (company_id) {
            query += ' WHERE company_id = $1';
            params.push(company_id);
        }

        query += ' ORDER BY date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching communications:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/crm/communications', async (req, res) => {
    try {
        const {
            contact_id, lead_id, company_id, type, subject, description, date, duration_minutes,
            outcome, follow_up_required, follow_up_date, created_by
        } = req.body;

        const result = await pool.query(
            `INSERT INTO crm_communications (
                contact_id, lead_id, company_id, type, subject, description, date, duration_minutes,
                outcome, follow_up_required, follow_up_date, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                contact_id, lead_id, company_id, type, subject, description, date || new Date(),
                duration_minutes, outcome, follow_up_required || false, follow_up_date,
                created_by
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating communication:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/crm/communications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM crm_communications WHERE id = $1', [id]);
        res.json({ message: 'Communication deleted successfully' });
    } catch (err) {
        console.error('Error deleting communication:', err);
        res.status(500).json({ error: err.message });
    }
});

// CRM Statistics
app.get('/api/crm/stats', async (req, res) => {
    try {
        const contactsCount = await pool.query('SELECT COUNT(*) as count FROM crm_contacts WHERE status = \'active\'');
        const leadsCount = await pool.query('SELECT COUNT(*) as count FROM crm_leads');
        const leadsValue = await pool.query('SELECT COALESCE(SUM(value), 0) as total FROM crm_leads WHERE status != \'lost\'');
        const recentActivities = await pool.query('SELECT COUNT(*) as count FROM crm_communications WHERE date >= NOW() - INTERVAL \'30 days\'');

        res.json({
            contacts: contactsCount.rows[0].count,
            leads: leadsCount.rows[0].count,
            leadsValue: leadsValue.rows[0].total,
            recentActivities: recentActivities.rows[0].count
        });
    } catch (err) {
        console.error('Error fetching CRM stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// CRM TASKS ENDPOINTS
// ==========================================
app.get('/api/crm/tasks', async (req, res) => {
    try {
        const { contact_id, company_id, status, priority } = req.query;
        let query = 'SELECT * FROM crm_tasks WHERE 1=1';
        let params = [];
        let paramCount = 0;

        if (contact_id) {
            paramCount++;
            query += ` AND contact_id = $${paramCount}`;
            params.push(contact_id);
        }
        if (company_id) {
            paramCount++;
            query += ` AND company_id = $${paramCount}`;
            params.push(company_id);
        }
        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            params.push(status);
        }
        if (priority) {
            paramCount++;
            query += ` AND priority = $${paramCount}`;
            params.push(priority);
        }

        query += ' ORDER BY due_date ASC NULLS LAST, created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/crm/tasks', async (req, res) => {
    try {
        const { contact_id, lead_id, company_id, title, description, type, priority, status, due_date, assigned_to, created_by } = req.body;
        const result = await pool.query(
            `INSERT INTO crm_tasks (contact_id, lead_id, company_id, title, description, type, priority, status, due_date, assigned_to, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [contact_id, lead_id, company_id, title, description, type, priority, status, due_date, assigned_to, created_by]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/crm/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, type, priority, status, due_date, assigned_to, completed_date } = req.body;
        const result = await pool.query(
            `UPDATE crm_tasks SET title = $1, description = $2, type = $3, priority = $4, status = $5, due_date = $6, assigned_to = $7, completed_date = $8, updated_at = NOW()
             WHERE id = $9 RETURNING *`,
            [title, description, type, priority, status, due_date, assigned_to, completed_date, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/crm/tasks/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM crm_tasks WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// CRM DOCUMENTS ENDPOINTS
// ==========================================
app.get('/api/crm/documents', async (req, res) => {
    try {
        const { contact_id, company_id } = req.query;
        let query = 'SELECT * FROM crm_documents WHERE status = \'active\'';
        let params = [];
        let paramCount = 0;

        if (contact_id) {
            paramCount++;
            query += ` AND contact_id = $${paramCount}`;
            params.push(contact_id);
        }
        if (company_id) {
            paramCount++;
            query += ` AND company_id = $${paramCount}`;
            params.push(company_id);
        }

        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching documents:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/crm/documents', async (req, res) => {
    try {
        const { contact_id, lead_id, company_id, name, type, file_path, file_size, mime_type, description, uploaded_by } = req.body;
        const result = await pool.query(
            `INSERT INTO crm_documents (contact_id, lead_id, company_id, name, type, file_path, file_size, mime_type, description, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [contact_id, lead_id, company_id, name, type, file_path, file_size, mime_type, description, uploaded_by]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating document:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/crm/documents/:id', async (req, res) => {
    try {
        await pool.query('UPDATE crm_documents SET status = \'deleted\' WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// EMAIL TEMPLATES ENDPOINTS
// ==========================================
app.get('/api/crm/email-templates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM crm_email_templates ORDER BY category, name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching email templates:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/crm/email-templates', async (req, res) => {
    try {
        const { name, subject, body, category, created_by } = req.body;
        const result = await pool.query(
            `INSERT INTO crm_email_templates (name, subject, body, category, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, subject, body, category, created_by]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating email template:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/crm/email-templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subject, body, category } = req.body;
        const result = await pool.query(
            `UPDATE crm_email_templates
             SET name = $1, subject = $2, body = $3, category = $4, updated_at = NOW()
             WHERE id = $5 RETURNING *`,
            [name, subject, body, category, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating email template:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/crm/email-templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM crm_email_templates WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting email template:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// SAVED FILTERS ENDPOINTS
// ==========================================
app.get('/api/crm/saved-filters', async (req, res) => {
    try {
        const { type } = req.query;
        let query = 'SELECT * FROM crm_saved_filters';
        const params = [];

        if (type) {
            query += ' WHERE type = $1';
            params.push(type);
        }

        query += ' ORDER BY is_default DESC, name';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching saved filters:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/crm/saved-filters', async (req, res) => {
    try {
        const { name, type, filter_config, is_default, created_by } = req.body;
        const result = await pool.query(
            `INSERT INTO crm_saved_filters (name, type, filter_config, is_default, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, type, JSON.stringify(filter_config), is_default, created_by]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating saved filter:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/crm/saved-filters/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM crm_saved_filters WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting saved filter:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// PIPELINE ANALYTICS ENDPOINTS
// ==========================================
app.get('/api/crm/analytics/pipeline', async (req, res) => {
    try {
        // Stage distribution
        const stageDistribution = await pool.query(`
            SELECT stage, COUNT(*) as count, COALESCE(SUM(value), 0) as total_value
            FROM deals
            WHERE status != 'closed_lost'
            GROUP BY stage
            ORDER BY
                CASE stage
                    WHEN 'Discovery' THEN 1
                    WHEN 'Qualification' THEN 2
                    WHEN 'Proposal' THEN 3
                    WHEN 'Negotiation' THEN 4
                    WHEN 'Closed Won' THEN 5
                    ELSE 6
                END
        `);

        // Conversion rates
        const conversionRates = await pool.query(`
            SELECT
                COUNT(CASE WHEN stage = 'Qualification' THEN 1 END)::float / NULLIF(COUNT(CASE WHEN stage = 'Discovery' THEN 1 END), 0) * 100 as discovery_to_qualification,
                COUNT(CASE WHEN stage = 'Proposal' THEN 1 END)::float / NULLIF(COUNT(CASE WHEN stage = 'Qualification' THEN 1 END), 0) * 100 as qualification_to_proposal,
                COUNT(CASE WHEN stage = 'Negotiation' THEN 1 END)::float / NULLIF(COUNT(CASE WHEN stage = 'Proposal' THEN 1 END), 0) * 100 as proposal_to_negotiation,
                COUNT(CASE WHEN stage = 'Closed Won' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as win_rate
            FROM deals
        `);

        // Average deal cycle time
        const dealCycle = await pool.query(`
            SELECT AVG(EXTRACT(DAY FROM (NOW() - created_at))) as avg_days
            FROM deals
            WHERE stage = 'Closed Won'
        `);

        res.json({
            stageDistribution: stageDistribution.rows,
            conversionRates: conversionRates.rows[0],
            avgDealCycle: dealCycle.rows[0]?.avg_days || 0
        });
    } catch (err) {
        console.error('Error fetching pipeline analytics:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// MIGRATION ENDPOINT (for development)
// ==========================================
app.post('/api/admin/migrate-crm-enhancements', async (req, res) => {
    try {
        console.log('🔧 Running CRM enhancements migration...');
        const results = [];

        // Add category to companies
        await pool.query(`ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS category VARCHAR(100)`);
        results.push('✅ Category added to crm_companies');

        // Add category to contacts
        await pool.query(`ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS category VARCHAR(100)`);
        results.push('✅ Category added to crm_contacts');

        // Add scoring fields to deals
        await pool.query(`
            ALTER TABLE deals
            ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
            ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS days_since_contact INTEGER,
            ADD COLUMN IF NOT EXISTS expected_close_date DATE,
            ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100),
            ADD COLUMN IF NOT EXISTS tags TEXT[]
        `);
        results.push('✅ Scoring fields added to deals');

        // Create tasks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS crm_tasks (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER REFERENCES crm_contacts(id) ON DELETE CASCADE,
                lead_id INTEGER,
                company_id INTEGER REFERENCES crm_companies(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                type VARCHAR(50) DEFAULT 'task',
                priority VARCHAR(20) DEFAULT 'medium',
                status VARCHAR(50) DEFAULT 'pending',
                due_date TIMESTAMP,
                completed_date TIMESTAMP,
                assigned_to VARCHAR(255),
                created_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        results.push('✅ Tasks table created');

        // Create documents table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS crm_documents (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER REFERENCES crm_contacts(id) ON DELETE CASCADE,
                lead_id INTEGER,
                company_id INTEGER REFERENCES crm_companies(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100),
                file_path VARCHAR(500),
                file_size INTEGER,
                mime_type VARCHAR(100),
                description TEXT,
                version INTEGER DEFAULT 1,
                status VARCHAR(50) DEFAULT 'active',
                uploaded_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        results.push('✅ Documents table created');

        // Create email templates table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS crm_email_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                subject VARCHAR(500),
                body TEXT,
                category VARCHAR(100),
                created_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        results.push('✅ Email templates table created');

        // Create saved filters table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS crm_saved_filters (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                filter_config JSONB,
                is_default BOOLEAN DEFAULT FALSE,
                created_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        results.push('✅ Saved filters table created');

        // Enhance communications table
        await pool.query(`
            ALTER TABLE crm_communications
            ADD COLUMN IF NOT EXISTS email_opened BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS email_clicked BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS email_sent_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS template_id INTEGER
        `);
        results.push('✅ Communications table enhanced');

        // Create indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_crm_companies_category ON crm_companies(category);
            CREATE INDEX IF NOT EXISTS idx_crm_contacts_category ON crm_contacts(category);
            CREATE INDEX IF NOT EXISTS idx_deals_priority ON deals(priority);
            CREATE INDEX IF NOT EXISTS idx_deals_score ON deals(score);
            CREATE INDEX IF NOT EXISTS idx_deals_expected_close_date ON deals(expected_close_date);
            CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON crm_tasks(due_date);
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON crm_tasks(status);
            CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON crm_tasks(contact_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON crm_tasks(company_id);
            CREATE INDEX IF NOT EXISTS idx_documents_contact_id ON crm_documents(contact_id);
            CREATE INDEX IF NOT EXISTS idx_documents_company_id ON crm_documents(company_id);
        `);
        results.push('✅ Indexes created');

        // Insert default email templates
        await pool.query(`
            INSERT INTO crm_email_templates (name, subject, category, body)
            SELECT 'Introduction', 'Introduction to {{company_name}}', 'intro', 'Hi {{contact_name}},

I hope this email finds you well. I wanted to reach out to introduce {{company_name}} and explore potential collaboration opportunities.

Best regards'
            WHERE NOT EXISTS (SELECT 1 FROM crm_email_templates WHERE name = 'Introduction')
        `);
        await pool.query(`
            INSERT INTO crm_email_templates (name, subject, category, body)
            SELECT 'Follow Up', 'Following up on our conversation', 'followup', 'Hi {{contact_name}},

I wanted to follow up on our recent conversation about {{topic}}. Do you have time this week to discuss next steps?

Best regards'
            WHERE NOT EXISTS (SELECT 1 FROM crm_email_templates WHERE name = 'Follow Up')
        `);
        await pool.query(`
            INSERT INTO crm_email_templates (name, subject, category, body)
            SELECT 'Proposal', 'Proposal for {{company_name}}', 'proposal', 'Hi {{contact_name}},

Please find attached our proposal for {{project_name}}. I would be happy to schedule a call to walk through the details.

Best regards'
            WHERE NOT EXISTS (SELECT 1 FROM crm_email_templates WHERE name = 'Proposal')
        `);
        await pool.query(`
            INSERT INTO crm_email_templates (name, subject, category, body)
            SELECT 'Meeting Request', 'Meeting Request', 'meeting', 'Hi {{contact_name}},

I would like to schedule a meeting to discuss {{topic}}. Are you available sometime this week?

Best regards'
            WHERE NOT EXISTS (SELECT 1 FROM crm_email_templates WHERE name = 'Meeting Request')
        `);
        results.push('✅ Email templates inserted');

        console.log('🎉 Migration complete!');
        res.json({ success: true, results });
    } catch (err) {
        console.error('❌ Migration error:', err);
        res.status(500).json({ error: err.message, details: err.stack });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
    =======================================
    🚀 SagaReg Backend Server Running
    =======================================
    📍 Local: http://localhost:${PORT}
    📍 Health: http://localhost:${PORT}/health
    📍 API: http://localhost:${PORT}/api
    
    Environment: ${process.env.NODE_ENV}
    =======================================
    `);
});

module.exports = app;
