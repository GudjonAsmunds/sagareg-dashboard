-- ==========================================
-- CRM ENHANCEMENTS MIGRATION SQL
-- Run this manually if migration scripts fail
-- ==========================================

-- Add category to companies
ALTER TABLE crm_companies
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add category to contacts
ALTER TABLE crm_contacts
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add scoring and priority fields to deals
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS days_since_contact INTEGER,
ADD COLUMN IF NOT EXISTS expected_close_date DATE,
ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create tasks table
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
);

-- Create documents table
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
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS crm_email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT,
    category VARCHAR(100),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create saved filters table
CREATE TABLE IF NOT EXISTS crm_saved_filters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    filter_config JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhance communications table for email tracking
ALTER TABLE crm_communications
ADD COLUMN IF NOT EXISTS email_opened BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_clicked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS template_id INTEGER;

-- Create indexes for better performance
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

-- Insert default email templates
INSERT INTO crm_email_templates (name, subject, category, body)
VALUES
    ('Introduction', 'Introduction to {{company_name}}', 'intro', 'Hi {{contact_name}},

I hope this email finds you well. I wanted to reach out to introduce {{company_name}} and explore potential collaboration opportunities.

Best regards'),
    ('Follow Up', 'Following up on our conversation', 'followup', 'Hi {{contact_name}},

I wanted to follow up on our recent conversation about {{topic}}. Do you have time this week to discuss next steps?

Best regards'),
    ('Proposal', 'Proposal for {{company_name}}', 'proposal', 'Hi {{contact_name}},

Please find attached our proposal for {{project_name}}. I would be happy to schedule a call to walk through the details.

Best regards'),
    ('Meeting Request', 'Meeting Request', 'meeting', 'Hi {{contact_name}},

I would like to schedule a meeting to discuss {{topic}}. Are you available sometime this week?

Best regards')
ON CONFLICT DO NOTHING;

-- Done!
SELECT 'Migration completed successfully!' as status;
