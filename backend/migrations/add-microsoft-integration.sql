-- Add Microsoft authentication fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS microsoft_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS microsoft_email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS microsoft_refresh_token TEXT;

-- Create table for storing document references
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
);

-- Create table for email history
CREATE TABLE IF NOT EXISTS email_history (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id),
    subject VARCHAR(500),
    body TEXT,
    recipients TEXT[], -- Array of email addresses
    cc_recipients TEXT[],
    bcc_recipients TEXT[],
    microsoft_message_id VARCHAR(255),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_documents_contact ON documents(contact_id);
CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_email_history_contact ON email_history(contact_id);
CREATE INDEX idx_email_history_sender ON email_history(sender_id);

-- Add document count to contacts view
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
GROUP BY c.id, comp.name;