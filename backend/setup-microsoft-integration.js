const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up Microsoft Integration...\n');

// Install required npm packages
console.log('Installing required packages...');
const packages = [
    '@azure/msal-node',
    '@microsoft/microsoft-graph-client',
    'isomorphic-fetch' // Required for Graph client in Node.js
];

try {
    execSync(`npm install ${packages.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Packages installed successfully\n');
} catch (error) {
    console.error('❌ Failed to install packages:', error.message);
    process.exit(1);
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
    console.log('⚠️  Please update .env with your Microsoft Azure AD credentials\n');
}

// Update server.js to include new routes
const serverPath = path.join(__dirname, 'server.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');

if (!serverContent.includes('microsoft-routes')) {
    const updatedContent = serverContent.replace(
        '// ============ API ROUTES ============',
        `// ============ API ROUTES ============

// Microsoft Integration Routes
const microsoftRoutes = require('./routes/microsoft-routes');
app.use('/api/microsoft', microsoftRoutes);`
    );

    fs.writeFileSync(serverPath, updatedContent);
    console.log('✅ Updated server.js with Microsoft routes\n');
}

console.log(`
========================================
Microsoft Integration Setup Complete!
========================================

Next Steps:

1. Register an app in Azure AD:
   - Go to https://portal.azure.com
   - Navigate to Azure Active Directory > App registrations
   - Click "New registration"
   - Set redirect URI to: http://localhost:5000/api/microsoft/auth/microsoft/callback
   - Note your Client ID and Tenant ID

2. Create a client secret:
   - In your app registration, go to "Certificates & secrets"
   - Create a new client secret
   - Copy the secret value immediately (it won't be shown again)

3. Configure API permissions:
   - In your app registration, go to "API permissions"
   - Add the following Microsoft Graph permissions:
     • Mail.Send (Delegated)
     • Mail.Read (Delegated)
     • Files.ReadWrite.All (Delegated)
     • Sites.ReadWrite.All (Delegated)
     • User.Read (Delegated)
     • offline_access (Delegated)
   - Grant admin consent if required

4. Update your .env file with:
   AZURE_CLIENT_ID=<your-client-id>
   AZURE_CLIENT_SECRET=<your-client-secret>
   AZURE_TENANT_ID=<your-tenant-id>

5. Run database migrations:
   psql -U your_username -d sagareg_db -f migrations/add-microsoft-integration.sql

6. Restart your server:
   npm start

7. In your frontend, import and use the MicrosoftIntegration components

========================================
`);