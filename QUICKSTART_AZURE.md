# Quick Start: Deploy to Azure in 15 Minutes

Follow these steps to get your SagaReg Dashboard running in Azure for your team.

## Before You Start

You need:
- [ ] Azure account with active subscription
- [ ] Azure CLI installed ([Download](https://aka.ms/installazurecliwindows))
- [ ] Microsoft App Registration credentials (Client ID, Tenant ID, Client Secret)
- [ ] 15 minutes

## Quick Deployment Steps

### 1. Open PowerShell as Administrator

```powershell
cd C:\Code\sagareg-dashboard
```

### 2. Run the Deployment Script

```powershell
.\deploy-to-azure.ps1
```

The script will:
- Create Azure resources (database, app service)
- Deploy your backend code
- Configure environment variables
- Save credentials to `azure-credentials.txt`

### 3. Deploy Frontend to Azure Static Web Apps

#### Using Azure Portal (Easiest):

1. Go to [Azure Portal](https://portal.azure.com)
2. Create new **Static Web App**
3. Fill in:
   - Name: `sagareg-dashboard`
   - Region: West Europe
   - Source: GitHub
   - Select your repository
   - Branch: main
   - Build preset: **React**
   - App location: `/frontend`
   - Output location: `build`

4. Click **Create**

5. After creation, go to **Configuration** and add:
   - Key: `REACT_APP_API_URL`
   - Value: `https://sagareg-backend.azurewebsites.net`

6. The frontend will deploy automatically via GitHub Actions

### 4. Update Microsoft App Registration

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory
2. App registrations → Find "SagaRegCrm"
3. Authentication → Redirect URIs → Add:
   ```
   https://sagareg-backend.azurewebsites.net/api/microsoft/auth/microsoft/callback
   ```
4. Save

### 5. Initialize Database

Connect to your Azure database and run migrations:

```powershell
# Set environment variable
$env:DATABASE_URL="<connection-string-from-azure-credentials.txt>"

# Run migrations
cd backend
node migrate-microsoft-proper.js
```

### 6. Test Your Deployment

1. **Backend**: Visit `https://sagareg-backend.azurewebsites.net/health`
   - Should show: `{"status":"OK"}`

2. **Frontend**: Visit your Static Web App URL (shown in Azure Portal)
   - Should load the dashboard

3. **Login**: Click "Sign in with Microsoft"
   - Should work with your Sagareg Microsoft account

## That's It!

Your dashboard is now live in Azure. Share the Static Web App URL with your team.

## Common Issues

**Problem**: Backend health check fails
- Solution: Check Application Insights or logs in Azure Portal

**Problem**: Login doesn't work
- Solution: Verify redirect URI is exactly correct in Microsoft App Registration

**Problem**: Database connection error
- Solution: Check DATABASE_URL environment variable in App Service configuration

## Need Help?

See full documentation: `AZURE_DEPLOYMENT.md`
