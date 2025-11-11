const msal = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
require('dotenv').config();

// Microsoft Authentication Configuration
const msalConfig = {
    auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: 'Info'
        }
    }
};

// Required scopes for the integration
const SCOPES = [
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/Files.ReadWrite.All',
    'https://graph.microsoft.com/Sites.ReadWrite.All',
    'https://graph.microsoft.com/Team.ReadBasic.All',  // To list user's teams
    'https://graph.microsoft.com/User.Read',
    'offline_access' // For refresh token
];

class MicrosoftIntegrationService {
    constructor() {
        this.msalClient = new msal.ConfidentialClientApplication(msalConfig);
        this.redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:8030/api/microsoft/auth/microsoft/callback';
    }

    // Generate auth URL for user to login
    async getAuthUrl(state) {
        const authCodeUrlParameters = {
            scopes: SCOPES,
            redirectUri: this.redirectUri,
            state: state || Math.random().toString(36).substring(7)
        };

        const authUrl = await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
        return authUrl;
    }

    // Exchange authorization code for tokens
    async getTokenFromCode(code) {
        const tokenRequest = {
            code: code,
            scopes: SCOPES,
            redirectUri: this.redirectUri
        };

        const response = await this.msalClient.acquireTokenByCode(tokenRequest);
        console.log('Token response received:', {
            hasAccessToken: !!response.accessToken,
            hasRefreshToken: !!response.refreshToken,
            hasIdToken: !!response.idToken,
            scopes: response.scopes,
            account: response.account ? {
                username: response.account.username,
                homeAccountId: response.account.homeAccountId
            } : null
        });

        // MSAL caches the refresh token internally but doesn't expose it in the response
        // We need to extract it from the token cache
        const tokenCache = this.msalClient.getTokenCache();
        const accounts = await tokenCache.getAllAccounts();

        if (accounts && accounts.length > 0) {
            const account = accounts[accounts.length - 1]; // Get the most recent account
            console.log('Account found in cache:', account.homeAccountId);

            // The refresh token is stored in the cache but not directly accessible
            // We'll store the account info and use it to get fresh tokens later
            response.account = account;
        }

        return response;
    }

    // Get access token using stored account info (MSAL handles refresh tokens internally)
    async getAccessTokenFromRefreshToken(accountInfo, userId) {
        try {
            // First, try silent token acquisition using the cache
            const tokenCache = this.msalClient.getTokenCache();
            const accounts = await tokenCache.getAllAccounts();

            // Find the account that matches this user
            const account = accounts.find(acc =>
                acc.homeAccountId === accountInfo ||
                acc.username === accountInfo
            ) || accounts[0]; // Fallback to first account

            if (!account) {
                console.error('No account found in MSAL cache for user:', userId);
                throw new Error('No cached account found. User needs to re-authenticate.');
            }

            const silentRequest = {
                account: account,
                scopes: SCOPES
            };

            const response = await this.msalClient.acquireTokenSilent(silentRequest);
            console.log('✅ Token acquired silently for user:', userId);
            return response.accessToken;
        } catch (error) {
            console.error('Error getting token silently:', error.message);
            throw new Error('Token refresh failed. User needs to re-authenticate.');
        }
    }

    // Create Graph API client
    getGraphClient(accessToken) {
        return Client.init({
            authProvider: (done) => {
                done(null, accessToken);
            }
        });
    }

    // Send email on behalf of the user
    async sendEmail(accessToken, emailData) {
        const client = this.getGraphClient(accessToken);

        const sendMail = {
            message: {
                subject: emailData.subject,
                body: {
                    contentType: emailData.isHtml ? 'HTML' : 'Text',
                    content: emailData.content
                },
                toRecipients: emailData.to.map(email => ({
                    emailAddress: { address: email }
                })),
                ccRecipients: emailData.cc ? emailData.cc.map(email => ({
                    emailAddress: { address: email }
                })) : [],
                bccRecipients: emailData.bcc ? emailData.bcc.map(email => ({
                    emailAddress: { address: email }
                })) : [],
                attachments: emailData.attachments || []
            },
            saveToSentItems: true
        };

        const result = await client.api('/me/sendMail').post(sendMail);
        return result;
    }

    // Get user's recent emails
    async getUserEmails(accessToken, filter = {}) {
        const client = this.getGraphClient(accessToken);

        let query = client.api('/me/messages')
            .select('subject,from,toRecipients,receivedDateTime,bodyPreview')
            .orderby('receivedDateTime DESC')
            .top(filter.limit || 10);

        if (filter.search) {
            query = query.search(`"${filter.search}"`);
        }

        const messages = await query.get();
        return messages.value;
    }

    // Upload document to Teams/SharePoint
    async uploadDocumentToTeams(accessToken, companyName, contactName, file) {
        const client = this.getGraphClient(accessToken);

        try {
            // First, search for the SagaReg team
            const teams = await client.api('/me/joinedTeams')
                .filter("displayName eq 'SagaReg' or displayName eq 'Sagareg'")
                .get();

            if (!teams.value || teams.value.length === 0) {
                throw new Error('SagaReg team not found. Please ensure you have access to the SagaReg team.');
            }

            const teamId = teams.value[0].id;

            // Get the SharePoint site associated with this team
            const teamSite = await client.api(`/groups/${teamId}/sites/root`).get();

            // Sanitize folder names
            const safeCompanyName = companyName.replace(/[<>:"/\\|?*]/g, '_');
            const safeContactName = contactName.replace(/[<>:"/\\|?*]/g, '_');

            // Create folder structure matching your Teams structure:
            // General/SagaReg/Projects/{CompanyName}/Contacts/{ContactName}
            const folderPath = `General/SagaReg/Projects/${safeCompanyName}/Contacts/${safeContactName}`;

            // Create folders if they don't exist
            await this.ensureFolderExists(client, teamSite.id, folderPath);

            // Upload file to Teams location
            const uploadUrl = `/sites/${teamSite.id}/drive/root:/${folderPath}/${file.originalname}:/content`;

            const uploadResult = await client.api(uploadUrl)
                .put(file.buffer);

            // Get the sharing link
            const shareLink = await client.api(`/sites/${teamSite.id}/drive/items/${uploadResult.id}/createLink`)
                .post({
                    type: 'view',
                    scope: 'organization'
                });

            return {
                fileId: uploadResult.id,
                fileName: uploadResult.name,
                webUrl: uploadResult.webUrl,
                shareUrl: shareLink.link.webUrl,
                folderPath: folderPath,
                size: uploadResult.size,
                createdDateTime: uploadResult.createdDateTime
            };
        } catch (error) {
            console.error('Error uploading to Teams:', error);
            throw error;
        }
    }

    // Ensure folder structure exists
    async ensureFolderExists(client, siteId, folderPath) {
        const pathParts = folderPath.split('/');
        let currentPath = '';

        for (const part of pathParts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            try {
                // Check if folder exists
                await client.api(`/sites/${siteId}/drive/root:/${currentPath}`)
                    .get();
            } catch (error) {
                // Folder doesn't exist, create it
                if (error.statusCode === 404) {
                    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
                    const folderName = part;

                    const endpoint = parentPath
                        ? `/sites/${siteId}/drive/root:/${parentPath}:/children`
                        : `/sites/${siteId}/drive/root/children`;

                    await client.api(endpoint).post({
                        name: folderName,
                        folder: {},
                        '@microsoft.graph.conflictBehavior': 'rename'
                    });
                }
            }
        }
    }

    // Get documents for a contact from Teams
    async getContactDocuments(accessToken, companyName, contactName) {
        const client = this.getGraphClient(accessToken);

        const safeCompanyName = companyName.replace(/[<>:"/\\|?*]/g, '_');
        const safeContactName = contactName.replace(/[<>:"/\\|?*]/g, '_');
        const folderPath = `General/SagaReg/Projects/${safeCompanyName}/Contacts/${safeContactName}`;

        try {
            // Get the SagaReg team
            const teams = await client.api('/me/joinedTeams')
                .filter("displayName eq 'SagaReg' or displayName eq 'Sagareg'")
                .get();

            if (!teams.value || teams.value.length === 0) {
                return []; // No team found, return empty array
            }

            const teamId = teams.value[0].id;
            const teamSite = await client.api(`/groups/${teamId}/sites/root`).get();

            // Get folder contents
            const children = await client.api(`/sites/${teamSite.id}/drive/root:/${folderPath}:/children`)
                .select('id,name,size,webUrl,createdDateTime,lastModifiedDateTime')
                .get();

            return children.value;
        } catch (error) {
            if (error.statusCode === 404) {
                return []; // Folder doesn't exist yet
            }
            throw error;
        }
    }

    // Download document from Teams
    async downloadDocument(accessToken, fileId) {
        const client = this.getGraphClient(accessToken);

        // Get the SagaReg team
        const teams = await client.api('/me/joinedTeams')
            .filter("displayName eq 'SagaReg' or displayName eq 'Sagareg'")
            .get();

        if (!teams.value || teams.value.length === 0) {
            throw new Error('SagaReg team not found');
        }

        const teamId = teams.value[0].id;
        const teamSite = await client.api(`/groups/${teamId}/sites/root`).get();

        const download = await client.api(`/sites/${teamSite.id}/drive/items/${fileId}/content`)
            .getStream();

        return download;
    }

    // Search documents across Teams
    async searchDocuments(accessToken, searchQuery) {
        const client = this.getGraphClient(accessToken);

        const searchResults = await client.api('/search/query').post({
            requests: [{
                entityTypes: ['driveItem'],
                query: {
                    queryString: searchQuery
                },
                from: 0,
                size: 25
            }]
        });

        return searchResults.value[0].hitsContainers[0].hits;
    }
}

module.exports = new MicrosoftIntegrationService();