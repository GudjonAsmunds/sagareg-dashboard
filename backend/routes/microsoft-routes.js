const express = require('express');
const router = express.Router();
const multer = require('multer');
const microsoftService = require('../services/microsoft-integration');
const { Pool } = require('pg');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Import authenticateToken from auth-routes
const { authenticateToken } = require('./auth-routes');

// Middleware to check if user has Microsoft auth
const requireMicrosoftAuth = async (req, res, next) => {
    // First check JWT authentication
    authenticateToken(req, res, async () => {
        // Now req.user is set from JWT
        const userId = req.user?.id || req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({
                error: 'Authentication required',
                authUrl: await microsoftService.getAuthUrl()
            });
        }

        try {
            const user = await pool.query(
                'SELECT microsoft_refresh_token FROM users WHERE id = $1',
                [userId]
            );

        if (!user.rows[0]?.microsoft_refresh_token) {
            console.log(`User ${userId} doesn't have Microsoft refresh token yet`);
            return res.status(401).json({
                error: 'Microsoft authentication required. Please reconnect your Microsoft account.',
                authUrl: await microsoftService.getAuthUrl()
            });
        }

        // Get fresh access token
        let accessToken;
        try {
            accessToken = await microsoftService.getAccessTokenFromRefreshToken(
                user.rows[0].microsoft_refresh_token,
                userId
            );
        } catch (tokenError) {
            console.error('Failed to get access token from refresh token:', tokenError);
            return res.status(401).json({
                error: 'Microsoft token expired. Please reconnect your Microsoft account.',
                authUrl: await microsoftService.getAuthUrl()
            });
        }

            req.microsoftAccessToken = accessToken;
            req.user = { id: userId }; // Set user context for downstream handlers
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(401).json({
                error: 'Authentication failed',
                authUrl: await microsoftService.getAuthUrl()
            });
        }
    });
};

// === Authentication Routes ===

// Initiate Microsoft login
router.get('/auth/microsoft', async (req, res) => {
    try {
        const authUrl = await microsoftService.getAuthUrl(req.query.state);
        res.json({ authUrl });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ error: 'Failed to generate auth URL' });
    }
});

// Handle Microsoft callback
router.get('/auth/microsoft/callback', async (req, res) => {
    const { code, state } = req.query;

    try {
        // Exchange code for tokens
        const tokenResponse = await microsoftService.getTokenFromCode(code);

        // Get user info from Microsoft
        const graphClient = microsoftService.getGraphClient(tokenResponse.accessToken);
        const userInfo = await graphClient.api('/me').get();

        // Check if this is SSO login or document integration
        const isSSO = state === 'sso-login';

        console.log('Microsoft callback - User info:', {
            email: userInfo.mail || userInfo.userPrincipalName,
            name: userInfo.displayName,
            microsoftId: userInfo.id,
            hasRefreshToken: !!tokenResponse.refreshToken,
            hasAccessToken: !!tokenResponse.accessToken,
            tokenResponseKeys: Object.keys(tokenResponse)
        });

        // Log the actual refresh token (first/last 10 chars only for security)
        if (tokenResponse.refreshToken) {
            const rt = tokenResponse.refreshToken;
            console.log('Refresh token preview:', rt.substring(0, 10) + '...' + rt.substring(rt.length - 10));
        } else {
            console.error('⚠️  WARNING: No refresh token received from Microsoft!');
            console.error('Token response structure:', JSON.stringify(tokenResponse, null, 2));
        }

        // Extract refresh token - MSAL stores it but we need to get it from the account
        let refreshTokenToStore = tokenResponse.refreshToken;

        // If refresh token is not directly available, store the account homeAccountId
        // which MSAL uses to retrieve tokens from cache
        if (!refreshTokenToStore && tokenResponse.account) {
            refreshTokenToStore = tokenResponse.account.homeAccountId;
            console.log('Storing homeAccountId as refresh token identifier:', refreshTokenToStore);
        }

        // Store or update user in database
        const result = await pool.query(
            `INSERT INTO users (email, name, microsoft_id, microsoft_email, microsoft_refresh_token, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (microsoft_id)
             DO UPDATE SET
                microsoft_refresh_token = $5,
                last_login = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [
                userInfo.mail || userInfo.userPrincipalName,
                userInfo.displayName,
                userInfo.id,
                userInfo.mail || userInfo.userPrincipalName,
                refreshTokenToStore
            ]
        );

        console.log('User saved/updated:', {
            userId: result.rows[0].id,
            hasRefreshToken: !!result.rows[0].microsoft_refresh_token
        });

        // Also ensure the user exists with the email (for dual auth support)
        await pool.query(
            `INSERT INTO users (email, name, microsoft_id, microsoft_email, microsoft_refresh_token, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (email)
             DO UPDATE SET
                microsoft_id = $3,
                microsoft_email = $4,
                microsoft_refresh_token = $5,
                last_login = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP`,
            [
                userInfo.mail || userInfo.userPrincipalName,
                userInfo.displayName,
                userInfo.id,
                userInfo.mail || userInfo.userPrincipalName,
                refreshTokenToStore
            ]
        );

        // Redirect to frontend with success
        res.redirect(`${process.env.FRONTEND_URL}?auth=success&userId=${result.rows[0].id}`);
    } catch (error) {
        console.error('Callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}?auth=failed`);
    }
});

// === Email Routes ===

// Send email
router.post('/email/send', requireMicrosoftAuth, async (req, res) => {
    const { contactId, subject, content, to, cc, bcc, attachments } = req.body;

    try {
        // Send email via Microsoft Graph
        await microsoftService.sendEmail(req.microsoftAccessToken, {
            subject,
            content,
            to: Array.isArray(to) ? to : [to],
            cc,
            bcc,
            attachments,
            isHtml: true
        });

        // Log email in database
        await pool.query(
            `INSERT INTO microsoft_email_history
             (contact_id, sender_id, subject, body, recipients, cc_recipients, bcc_recipients, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
            [contactId, req.user?.id, subject, content, to, cc, bcc]
        );

        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Email send error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Get emails for a contact
router.get('/email/contact/:contactId', requireMicrosoftAuth, async (req, res) => {
    const { contactId } = req.params;

    try {
        // Get contact info
        const contact = await pool.query(
            'SELECT email, name FROM crm_contacts WHERE id = $1',
            [contactId]
        );

        if (!contact.rows[0]) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        // Search emails from Microsoft
        const emails = await microsoftService.getUserEmails(req.microsoftAccessToken, {
            search: contact.rows[0].email,
            limit: 50
        });

        // Get email history from database
        const dbEmails = await pool.query(
            'SELECT * FROM microsoft_email_history WHERE contact_id = $1 ORDER BY sent_at DESC',
            [contactId]
        );

        res.json({
            microsoftEmails: emails,
            sentEmails: dbEmails.rows
        });
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

// === Document Routes ===

// Upload document for a contact
router.post('/documents/upload/:contactId', requireMicrosoftAuth, upload.single('file'), async (req, res) => {
    const { contactId } = req.params;

    try {
        // Get contact and company info
        const contactInfo = await pool.query(
            `SELECT c.full_name as contact_name, c.company_id, comp.name as company_name
             FROM crm_contacts c
             LEFT JOIN crm_companies comp ON c.company_id = comp.id
             WHERE c.id = $1`,
            [contactId]
        );

        if (!contactInfo.rows[0]) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const { contact_name, company_id, company_name } = contactInfo.rows[0];

        // Upload to Teams/SharePoint
        const uploadResult = await microsoftService.uploadDocumentToTeams(
            req.microsoftAccessToken,
            company_name || 'No Company',
            contact_name,
            req.file
        );

        // Save document reference in database
        await pool.query(
            `INSERT INTO microsoft_documents
             (contact_id, company_id, file_name, file_type, file_size, teams_file_id, teams_web_url, teams_folder_path, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                contactId,
                company_id,
                uploadResult.fileName,
                req.file.mimetype,
                uploadResult.size,
                uploadResult.fileId,
                uploadResult.webUrl,
                uploadResult.folderPath,
                req.user?.id
            ]
        );

        res.json({
            success: true,
            document: uploadResult
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

// Get documents for a contact
router.get('/documents/contact/:contactId', requireMicrosoftAuth, async (req, res) => {
    const { contactId } = req.params;

    try {
        // Get contact info
        const contactInfo = await pool.query(
            `SELECT c.full_name as contact_name, comp.name as company_name
             FROM crm_contacts c
             LEFT JOIN crm_companies comp ON c.company_id = comp.id
             WHERE c.id = $1`,
            [contactId]
        );

        if (!contactInfo.rows[0]) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const { contact_name, company_name } = contactInfo.rows[0];

        // Get documents from Teams
        const teamsDocuments = await microsoftService.getContactDocuments(
            req.microsoftAccessToken,
            company_name || 'No Company',
            contact_name
        );

        // Get document records from database
        const dbDocuments = await pool.query(
            `SELECT d.*, u.name as uploaded_by_name
             FROM microsoft_documents d
             LEFT JOIN users u ON d.uploaded_by = u.id
             WHERE d.contact_id = $1
             ORDER BY d.created_at DESC`,
            [contactId]
        );

        res.json({
            teamsDocuments,
            dbDocuments: dbDocuments.rows
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// Download document
router.get('/documents/download/:fileId', requireMicrosoftAuth, async (req, res) => {
    const { fileId } = req.params;

    try {
        const fileStream = await microsoftService.downloadDocument(
            req.microsoftAccessToken,
            fileId
        );

        // Get file info from database
        const fileInfo = await pool.query(
            'SELECT file_name, file_type FROM microsoft_documents WHERE teams_file_id = $1',
            [fileId]
        );

        if (fileInfo.rows[0]) {
            res.setHeader('Content-Type', fileInfo.rows[0].file_type);
            res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.rows[0].file_name}"`);
        }

        fileStream.pipe(res);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
});

// Search documents
router.get('/documents/search', requireMicrosoftAuth, async (req, res) => {
    const { query } = req.query;

    try {
        const searchResults = await microsoftService.searchDocuments(
            req.microsoftAccessToken,
            query
        );

        res.json(searchResults);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to search documents' });
    }
});

module.exports = router;