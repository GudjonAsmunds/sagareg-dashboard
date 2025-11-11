# Azure Deployment Guide for SagaReg Dashboard

This guide will help you deploy the SagaReg Dashboard to Azure for your team to use.

## Architecture Overview

- **Frontend**: Azure Static Web Apps (React app)
- **Backend**: Azure App Service (Node.js API)
- **Database**: Azure Database for PostgreSQL
- **CI/CD**: GitHub Actions (automated deployment)

## Prerequisites

- Azure account with active subscription
- Azure CLI installed (`az --version` to check)
- Git repository (GitHub recommended for CI/CD)
- Node.js 18.x or higher

## Step 1: Set Up Azure PostgreSQL Database

### Option A: Using Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new resource → "Azure Database for PostgreSQL"
3. Choose "Flexible Server" (recommended)
4. Configure:
   - **Server name**: `sagareg-postgres`
   - **Region**: Choose closest to your team (e.g., West Europe)
   - **PostgreSQL version**: 14 or higher
   - **Compute + storage**: Burstable, B1ms (1 vCore, 2GB RAM) for small team
   - **Admin username**: `sagaadmin`
   - **Password**: Create a strong password and save it

5. **Networking**:
   - Allow access from Azure services: YES
   - Add your current IP address for initial setup
   - Later, you'll add the App Service IP

6. Click **Review + Create**

### Option B: Using Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name sagareg-rg --location westeurope

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group sagareg-rg \
  --name sagareg-postgres \
  --location westeurope \
  --admin-user sagaadmin \
  --admin-password <YOUR_SECURE_PASSWORD> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14 \
  --storage-size 32

# Allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group sagareg-rg \
  --name sagareg-postgres \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Get Connection String

After creation, get your connection string:

```bash
az postgres flexible-server show-connection-string \
  --server-name sagareg-postgres \
  --database-name postgres \
  --admin-user sagaadmin \
  --admin-password <YOUR_PASSWORD>
```

Format: `postgresql://sagaadmin:<PASSWORD>@sagareg-postgres.postgres.database.azure.com/postgres?sslmode=require`

### Initialize Database Schema

Run the migration script on your Azure database:

```bash
# From your local machine
cd backend
node migrate-microsoft-proper.js
```

Make sure your `.env` file has the Azure DATABASE_URL before running migrations.

## Step 2: Create Azure App Service for Backend

### Using Azure Portal

1. Create new resource → "Web App"
2. Configure:
   - **Name**: `sagareg-backend` (will be sagareg-backend.azurewebsites.net)
   - **Publish**: Code
   - **Runtime stack**: Node 18 LTS
   - **Operating System**: Linux
   - **Region**: Same as database (West Europe)
   - **Pricing plan**: Basic B1 or Standard S1

3. Click **Review + Create**

### Using Azure CLI

```bash
# Create App Service plan
az appservice plan create \
  --name sagareg-plan \
  --resource-group sagareg-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group sagareg-rg \
  --plan sagareg-plan \
  --name sagareg-backend \
  --runtime "NODE|18-lts"
```

### Configure Environment Variables

In Azure Portal → App Service → Configuration → Application settings, add:

```
NODE_ENV=production
DATABASE_URL=<your-azure-postgres-connection-string>
JWT_SECRET=<generate-a-secure-random-string>
AZURE_CLIENT_ID=<your-microsoft-app-client-id>
AZURE_TENANT_ID=<your-microsoft-tenant-id>
AZURE_CLIENT_SECRET=<your-microsoft-app-secret>
MICROSOFT_REDIRECT_URI=https://sagareg-backend.azurewebsites.net/api/microsoft/auth/microsoft/callback
FRONTEND_URL=https://<your-static-web-app-url>.azurestaticapps.net
PORT=8080
```

Or using CLI:

```bash
az webapp config appsettings set \
  --resource-group sagareg-rg \
  --name sagareg-backend \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="<connection-string>" \
    JWT_SECRET="<secret>" \
    AZURE_CLIENT_ID="<client-id>" \
    AZURE_TENANT_ID="<tenant-id>" \
    AZURE_CLIENT_SECRET="<client-secret>" \
    MICROSOFT_REDIRECT_URI="https://sagareg-backend.azurewebsites.net/api/microsoft/auth/microsoft/callback" \
    FRONTEND_URL="https://<static-web-app>.azurestaticapps.net" \
    PORT=8080
```

## Step 3: Create Azure Static Web App for Frontend

### Using Azure Portal

1. Create new resource → "Static Web App"
2. Configure:
   - **Name**: `sagareg-dashboard`
   - **Region**: West Europe
   - **Plan type**: Free (or Standard for production)
   - **Deployment source**: GitHub
   - **Repository**: Select your GitHub repo
   - **Branch**: main/master
   - **Build preset**: React
   - **App location**: `/frontend`
   - **Api location**: (leave empty)
   - **Output location**: `build`

3. This will automatically:
   - Connect to your GitHub repo
   - Create a GitHub Actions workflow
   - Deploy on every push

### Using Azure CLI

```bash
az staticwebapp create \
  --name sagareg-dashboard \
  --resource-group sagareg-rg \
  --source https://github.com/<YOUR_GITHUB_USERNAME>/sagareg-dashboard \
  --location westeurope \
  --branch main \
  --app-location "frontend" \
  --output-location "build" \
  --login-with-github
```

### Configure Frontend Environment

Add environment variable in Static Web App → Configuration:

```
REACT_APP_API_URL=https://sagareg-backend.azurewebsites.net
```

## Step 4: Update Microsoft App Registration

Since your redirect URI will change in production:

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Find your "SagaRegCrm" app
3. Go to **Authentication** → **Redirect URIs**
4. Add the new production redirect URI:
   - `https://sagareg-backend.azurewebsites.net/api/microsoft/auth/microsoft/callback`
5. Save

## Step 5: Set Up GitHub Secrets for CI/CD

In your GitHub repository settings → Secrets and variables → Actions, add:

### Required Secrets

1. **AZURE_WEBAPP_PUBLISH_PROFILE**:
   ```bash
   # Get publish profile from Azure
   az webapp deployment list-publishing-profiles \
     --resource-group sagareg-rg \
     --name sagareg-backend \
     --xml
   ```
   Copy the entire XML output and paste as secret value

2. **AZURE_STATIC_WEB_APPS_API_TOKEN**:
   - Get from Azure Portal → Static Web App → Manage deployment token
   - Copy and paste as secret value

3. **REACT_APP_API_URL**:
   - Value: `https://sagareg-backend.azurewebsites.net`

## Step 6: Initialize Git Repository (if not already)

```bash
cd C:/Code/sagareg-dashboard

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - SagaReg Dashboard"

# Create GitHub repository (using GitHub CLI)
gh repo create sagareg-dashboard --private --source=. --remote=origin --push

# Or manually:
# 1. Create repo on GitHub.com
# 2. git remote add origin https://github.com/<YOUR_USERNAME>/sagareg-dashboard.git
# 3. git branch -M main
# 4. git push -u origin main
```

## Step 7: Deploy!

Once everything is configured:

```bash
# Push to GitHub - this triggers automatic deployment
git push origin main
```

Monitor the deployment:
- GitHub → Actions tab → Watch the deployment workflow
- Azure Portal → App Service → Deployment Center
- Azure Portal → Static Web App → GitHub Action runs

## Step 8: Verify Deployment

1. **Backend Health Check**:
   ```
   https://sagareg-backend.azurewebsites.net/health
   ```
   Should return: `{"status":"OK","timestamp":"..."}`

2. **Frontend**:
   ```
   https://<your-static-web-app>.azurestaticapps.net
   ```
   Should load the dashboard

3. **Test Login**:
   - Try logging in with Microsoft SSO
   - Upload a document
   - Send an email

## Troubleshooting

### Backend Issues

**Check logs**:
```bash
az webapp log tail --resource-group sagareg-rg --name sagareg-backend
```

**Common issues**:
- Database connection: Verify DATABASE_URL is correct
- CORS errors: Check FRONTEND_URL environment variable
- Microsoft auth: Verify redirect URI matches exactly

### Frontend Issues

**Check build logs**:
- GitHub → Actions → Latest workflow run

**Common issues**:
- API calls failing: Check REACT_APP_API_URL is set correctly
- CORS errors: Backend needs to allow the Static Web App URL

### Database Issues

**Connect to database**:
```bash
psql "postgresql://sagaadmin:<PASSWORD>@sagareg-postgres.postgres.database.azure.com/postgres?sslmode=require"
```

**Check tables exist**:
```sql
\dt
```

## Cost Estimation (Monthly)

- **PostgreSQL Flexible Server (B1ms)**: ~$12-15/month
- **App Service (B1)**: ~$13/month
- **Static Web App (Free tier)**: $0
- **Total**: ~$25-30/month

For production with more users, consider:
- App Service: S1 (~$70/month) for better performance
- PostgreSQL: D2s_v3 (~$120/month) for more resources

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (at least 32 random characters)
- [ ] Enable HTTPS only (Azure does this by default)
- [ ] Configure Azure AD for team access control
- [ ] Set up firewall rules for PostgreSQL
- [ ] Enable Application Insights for monitoring
- [ ] Set up automated backups for database

## Monitoring & Maintenance

### Application Insights (Recommended)

Enable Application Insights for both backend and frontend:

```bash
az monitor app-insights component create \
  --app sagareg-insights \
  --location westeurope \
  --resource-group sagareg-rg
```

### Database Backups

Azure PostgreSQL Flexible Server has automatic backups enabled. To restore:

```bash
az postgres flexible-server restore \
  --resource-group sagareg-rg \
  --name sagareg-postgres-restored \
  --source-server sagareg-postgres \
  --restore-time "2025-01-15T13:10:00Z"
```

## Next Steps

After deployment:

1. Share the Static Web App URL with your team
2. Set up Azure AD group for Sagareg team access
3. Configure custom domain (optional): `crm.sagareg.com`
4. Set up monitoring and alerts
5. Create runbook for common operations

## Support

For issues:
- Azure support: [Azure Portal](https://portal.azure.com) → Help + support
- Application issues: Check GitHub Actions logs and Azure App Service logs
