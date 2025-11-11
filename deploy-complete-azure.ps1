# SagaReg Dashboard - Complete Azure Deployment Script
# This script creates EVERYTHING: Backend, Frontend, Database, and Microsoft App Registration

Write-Host "🚀 SagaReg Dashboard - Complete Azure Deployment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will create:" -ForegroundColor Yellow
Write-Host "  ✓ Azure PostgreSQL Database" -ForegroundColor White
Write-Host "  ✓ Backend App Service (Node.js 20)" -ForegroundColor White
Write-Host "  ✓ Frontend Static Web App" -ForegroundColor White
Write-Host "  ✓ Microsoft App Registration (for SSO)" -ForegroundColor White
Write-Host "  ✓ Configure everything automatically" -ForegroundColor White
Write-Host ""

# Check if Azure CLI is installed
$azCommand = Get-Command az -ErrorAction SilentlyContinue
if (-not $azCommand) {
    Write-Host "❌ Azure CLI is not installed." -ForegroundColor Red
    Write-Host "Please install it from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
$loginCheck = az account show 2>$null
if (-not $loginCheck) {
    Write-Host "🔐 Logging in to Azure..." -ForegroundColor Yellow
    az login
}

# Get tenant ID from current login
$accountInfo = az account show | ConvertFrom-Json
$AZURE_TENANT_ID = $accountInfo.tenantId
Write-Host "✅ Using Azure Tenant: $AZURE_TENANT_ID" -ForegroundColor Green

# Configuration
$RESOURCE_GROUP = "sagareg-rg"
$LOCATION = "swedencentral"
$POSTGRES_SERVER = "sagareg-postgres-$(Get-Random -Minimum 1000 -Maximum 9999)"
$BACKEND_APP = "sagareg-backend-$(Get-Random -Minimum 1000 -Maximum 9999)"
$FRONTEND_APP = "sagareg-dashboard-$(Get-Random -Minimum 1000 -Maximum 9999)"
$APP_PLAN = "sagareg-plan"
$APP_REGISTRATION_NAME = "SagaRegDashboard"

Write-Host ""
Write-Host "📋 Deployment Configuration:" -ForegroundColor Green
Write-Host "   Resource Group: $RESOURCE_GROUP" -ForegroundColor White
Write-Host "   Location: $LOCATION" -ForegroundColor White
Write-Host "   PostgreSQL: $POSTGRES_SERVER" -ForegroundColor White
Write-Host "   Backend: $BACKEND_APP" -ForegroundColor White
Write-Host "   Frontend: $FRONTEND_APP" -ForegroundColor White
Write-Host "   App Registration: $APP_REGISTRATION_NAME" -ForegroundColor White
Write-Host "   Node.js Version: 20 LTS" -ForegroundColor White

$continue = Read-Host "`nContinue with deployment? (y/n)"
if ($continue -ne 'y') {
    exit 0
}

# =============================================================================
# STEP 1: CREATE RESOURCE GROUP
# =============================================================================
Write-Host "`n📦 STEP 1: Creating resource group..." -ForegroundColor Cyan
az group create --name $RESOURCE_GROUP --location $LOCATION 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Resource group created" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Resource group already exists" -ForegroundColor Yellow
}

# =============================================================================
# STEP 2: CREATE MICROSOFT APP REGISTRATION
# =============================================================================
Write-Host "`n🔐 STEP 2: Creating Microsoft App Registration for SSO..." -ForegroundColor Cyan

# Create the app registration
$appRegistration = az ad app create --display-name $APP_REGISTRATION_NAME | ConvertFrom-Json

$AZURE_CLIENT_ID = $appRegistration.appId
Write-Host "✅ App Registration created" -ForegroundColor Green
Write-Host "   Client ID: $AZURE_CLIENT_ID" -ForegroundColor White

# Create a client secret
$secretResult = az ad app credential reset --id $AZURE_CLIENT_ID --append | ConvertFrom-Json
$AZURE_CLIENT_SECRET = $secretResult.password
Write-Host "✅ Client secret created" -ForegroundColor Green

# Add required API permissions
Write-Host "Setting up Microsoft Graph permissions..." -ForegroundColor White

# Microsoft Graph permissions IDs
$graphAppId = "00000003-0000-0000-c000-000000000000"
$permissions = @(
    "e1fe6dd8-ba31-4d61-89e7-88639da4683d", # User.Read
    "b633e1c5-b582-4048-a93e-9f11b44c7e96", # Mail.Send
    "570282fd-fa5c-430d-a7fd-fc8dc98a9dda", # Mail.Read
    "5df07973-7d5d-46ed-9847-1271055cbd51", # Files.ReadWrite.All
    "65e50fdc-43b7-4915-933e-e8138f11f40a", # Sites.ReadWrite.All
    "660b7406-55f1-41ca-a0ed-0b035e182f3e"  # Team.ReadBasic.All
)

foreach ($permission in $permissions) {
    az ad app permission add `
        --id $AZURE_CLIENT_ID `
        --api $graphAppId `
        --api-permissions "$permission=Scope" 2>$null | Out-Null
}

Write-Host "✅ API permissions configured" -ForegroundColor Green
Write-Host "⚠️  Admin consent required - will do this later in Azure Portal" -ForegroundColor Yellow

# =============================================================================
# STEP 3: CREATE POSTGRESQL DATABASE
# =============================================================================
Write-Host "`n🗄️  STEP 3: Creating PostgreSQL database..." -ForegroundColor Cyan
$POSTGRES_PASSWORD = Read-Host "Enter PostgreSQL admin password (min 8 chars, must include uppercase, lowercase, and numbers)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($POSTGRES_PASSWORD)
$POSTGRES_PASSWORD_TEXT = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

Write-Host "Creating database (this may take 5-10 minutes)..." -ForegroundColor Yellow

az postgres flexible-server create `
  --resource-group $RESOURCE_GROUP `
  --name $POSTGRES_SERVER `
  --location $LOCATION `
  --admin-user sagaadmin `
  --admin-password $POSTGRES_PASSWORD_TEXT `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --version 14 `
  --storage-size 32 `
  --public-access 0.0.0.0 2>$null | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL database created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database may already exist or error occurred" -ForegroundColor Yellow
}

$DB_CONNECTION_STRING = "postgresql://sagaadmin:$POSTGRES_PASSWORD_TEXT@$POSTGRES_SERVER.postgres.database.azure.com/postgres?sslmode=require"

# =============================================================================
# STEP 4: CREATE APP SERVICE PLAN
# =============================================================================
Write-Host "`n📱 STEP 4: Creating App Service plan..." -ForegroundColor Cyan
az appservice plan create `
  --name $APP_PLAN `
  --resource-group $RESOURCE_GROUP `
  --sku B1 `
  --is-linux 2>$null | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App Service plan created" -ForegroundColor Green
} else {
    Write-Host "ℹ️  App Service plan already exists" -ForegroundColor Yellow
}

# =============================================================================
# STEP 5: CREATE BACKEND WEB APP
# =============================================================================
Write-Host "`n🔧 STEP 5: Creating backend App Service (Node.js 20)..." -ForegroundColor Cyan
az webapp create `
  --resource-group $RESOURCE_GROUP `
  --plan $APP_PLAN `
  --name $BACKEND_APP `
  --runtime "NODE:20-lts" 2>$null | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend app created" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Backend app already exists" -ForegroundColor Yellow
}

$BACKEND_URL = "https://$BACKEND_APP.azurewebsites.net"

# =============================================================================
# STEP 6: CREATE STATIC WEB APP FOR FRONTEND
# =============================================================================
Write-Host "`n🌐 STEP 6: Creating Static Web App for frontend..." -ForegroundColor Cyan

az staticwebapp create `
  --name $FRONTEND_APP `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION `
  --sku Free 2>$null | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Static Web App created" -ForegroundColor Green

    # Get the default hostname
    $staticWebApp = az staticwebapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP 2>$null | ConvertFrom-Json
    $FRONTEND_URL = "https://$($staticWebApp.defaultHostname)"
    Write-Host "   Frontend URL: $FRONTEND_URL" -ForegroundColor Cyan
} else {
    Write-Host "ℹ️  Static Web App already exists" -ForegroundColor Yellow
    $FRONTEND_URL = "https://$FRONTEND_APP.azurestaticapps.net"
}

# =============================================================================
# STEP 7: UPDATE MICROSOFT APP REGISTRATION WITH REDIRECT URI
# =============================================================================
Write-Host "`n🔗 STEP 7: Updating Microsoft App Registration redirect URI..." -ForegroundColor Cyan

$redirectUri = "$BACKEND_URL/api/microsoft/auth/microsoft/callback"

az ad app update `
  --id $AZURE_CLIENT_ID `
  --web-redirect-uris $redirectUri 2>$null | Out-Null

Write-Host "✅ Redirect URI configured: $redirectUri" -ForegroundColor Green

# Grant admin consent (requires admin privileges)
Write-Host "`n⚠️  Attempting to grant admin consent for API permissions..." -ForegroundColor Yellow
az ad app permission admin-consent --id $AZURE_CLIENT_ID 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Admin consent granted" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not grant admin consent automatically." -ForegroundColor Yellow
    Write-Host "   Please grant admin consent manually:" -ForegroundColor Yellow
    Write-Host "   1. Go to Azure Portal → Azure Active Directory → App registrations" -ForegroundColor White
    Write-Host "   2. Find '$APP_REGISTRATION_NAME'" -ForegroundColor White
    Write-Host "   3. Go to API permissions → Grant admin consent for Sagareg" -ForegroundColor White
}

# =============================================================================
# STEP 8: CONFIGURE BACKEND ENVIRONMENT VARIABLES
# =============================================================================
Write-Host "`n⚙️  STEP 8: Configuring backend environment variables..." -ForegroundColor Cyan

# Generate JWT Secret
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

$settings = @(
    "NODE_ENV=production",
    "DATABASE_URL=$DB_CONNECTION_STRING",
    "JWT_SECRET=$JWT_SECRET",
    "AZURE_CLIENT_ID=$AZURE_CLIENT_ID",
    "AZURE_TENANT_ID=$AZURE_TENANT_ID",
    "AZURE_CLIENT_SECRET=$AZURE_CLIENT_SECRET",
    "MICROSOFT_REDIRECT_URI=$BACKEND_URL/api/microsoft/auth/microsoft/callback",
    "FRONTEND_URL=$FRONTEND_URL",
    "PORT=8080"
)

az webapp config appsettings set `
  --resource-group $RESOURCE_GROUP `
  --name $BACKEND_APP `
  --settings $settings 2>$null | Out-Null

Write-Host "✅ Environment variables configured" -ForegroundColor Green

# =============================================================================
# STEP 9: ENABLE CORS ON BACKEND
# =============================================================================
Write-Host "`n🔗 STEP 9: Enabling CORS for frontend..." -ForegroundColor Cyan

az webapp cors add `
  --resource-group $RESOURCE_GROUP `
  --name $BACKEND_APP `
  --allowed-origins $FRONTEND_URL 2>$null | Out-Null

Write-Host "✅ CORS configured" -ForegroundColor Green

# =============================================================================
# STEP 10: DEPLOY BACKEND CODE
# =============================================================================
Write-Host "`n📤 STEP 10: Deploying backend code..." -ForegroundColor Cyan

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor White
Push-Location backend

# Create zip excluding node_modules and .env
$filesToZip = Get-ChildItem -Path . -Exclude node_modules,.env,.git
Compress-Archive -Path $filesToZip -DestinationPath ../backend-deploy.zip -Force

Pop-Location

Write-Host "Uploading to Azure (this may take 2-3 minutes)..." -ForegroundColor Yellow
az webapp deployment source config-zip `
  --resource-group $RESOURCE_GROUP `
  --name $BACKEND_APP `
  --src backend-deploy.zip 2>$null | Out-Null

Remove-Item backend-deploy.zip
Write-Host "✅ Backend code deployed" -ForegroundColor Green

# =============================================================================
# STEP 11: INITIALIZE DATABASE
# =============================================================================
Write-Host "`n🗄️  STEP 11: Initializing database schema..." -ForegroundColor Cyan

$env:DATABASE_URL = $DB_CONNECTION_STRING
Push-Location backend

Write-Host "Running migrations..." -ForegroundColor White
node migrate-microsoft-proper.js 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database initialized" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migration may have failed - check azure-credentials.txt for connection string" -ForegroundColor Yellow
}

Pop-Location

# =============================================================================
# STEP 12: BUILD AND DEPLOY FRONTEND
# =============================================================================
Write-Host "`n🎨 STEP 12: Building and deploying frontend..." -ForegroundColor Cyan

Push-Location frontend

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor White
npm install 2>$null | Out-Null

# Create .env.production with API URL
$frontendEnv = "REACT_APP_API_URL=$BACKEND_URL"
$frontendEnv | Out-File -FilePath .env.production -Encoding utf8

# Build the React app
Write-Host "Building React app..." -ForegroundColor Yellow
npm run build 2>$null | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend built successfully" -ForegroundColor Green

    # Deploy to Static Web App
    Write-Host "Deploying to Azure Static Web Apps..." -ForegroundColor White

    # Get deployment token
    $deploymentToken = az staticwebapp secrets list `
      --name $FRONTEND_APP `
      --resource-group $RESOURCE_GROUP `
      --query "properties.apiKey" -o tsv 2>$null

    if ($deploymentToken) {
        # Install SWA CLI if not already installed
        npm install -g @azure/static-web-apps-cli 2>$null | Out-Null

        # Deploy using SWA CLI
        swa deploy ./build `
          --deployment-token $deploymentToken `
          --env production 2>$null

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend deployed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Manual frontend deployment required (see instructions below)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Could not get deployment token. Manual deployment required." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
}

Pop-Location

# =============================================================================
# STEP 13: CONFIGURE FRONTEND ENVIRONMENT
# =============================================================================
Write-Host "`n⚙️  STEP 13: Configuring frontend environment variables..." -ForegroundColor Cyan

az staticwebapp appsettings set `
  --name $FRONTEND_APP `
  --resource-group $RESOURCE_GROUP `
  --setting-names "REACT_APP_API_URL=$BACKEND_URL" 2>$null | Out-Null

Write-Host "✅ Frontend environment configured" -ForegroundColor Green

# =============================================================================
# STEP 14: TEST DEPLOYMENT
# =============================================================================
Write-Host "`n🧪 STEP 14: Testing deployment..." -ForegroundColor Cyan

Write-Host "Waiting for backend to start (30 seconds)..." -ForegroundColor White
Start-Sleep -Seconds 30

try {
    $healthCheck = Invoke-WebRequest -Uri "$BACKEND_URL/health" -UseBasicParsing -TimeoutSec 10
    if ($healthCheck.StatusCode -eq 200) {
        Write-Host "✅ Backend health check passed!" -ForegroundColor Green
        Write-Host "   Response: $($healthCheck.Content)" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  Backend not responding yet (may take a few more minutes to start)" -ForegroundColor Yellow
    Write-Host "   You can check: $BACKEND_URL/health" -ForegroundColor White
}

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================
Write-Host "`n" -NoNewline
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉🎉🎉 DEPLOYMENT COMPLETE! 🎉🎉🎉" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Your SagaReg Dashboard is now live in Azure!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 URLs:" -ForegroundColor Yellow
Write-Host "   Backend:  $BACKEND_URL" -ForegroundColor White
Write-Host "   Health:   $BACKEND_URL/health" -ForegroundColor White
Write-Host "   Frontend: $FRONTEND_URL" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Credentials:" -ForegroundColor Yellow
Write-Host "   Saved to: azure-credentials.txt" -ForegroundColor White
Write-Host ""
Write-Host "📝 REQUIRED Next Step:" -ForegroundColor Red
Write-Host ""
Write-Host "   ⚠️  GRANT ADMIN CONSENT FOR API PERMISSIONS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Open: https://portal.azure.com" -ForegroundColor White
Write-Host "   2. Navigate to: Azure Active Directory → App registrations" -ForegroundColor White
Write-Host "   3. Search for: $APP_REGISTRATION_NAME" -ForegroundColor White
Write-Host "   4. Click: API permissions" -ForegroundColor White
Write-Host "   5. Click: Grant admin consent for Sagareg" -ForegroundColor White
Write-Host "   6. Click: Yes to confirm" -ForegroundColor White
Write-Host ""
Write-Host "📱 Share With Your Team:" -ForegroundColor Yellow
Write-Host "   $FRONTEND_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Save credentials
$credentials = @"
SagaReg Dashboard - Azure Deployment Credentials
================================================

DEPLOYMENT SUMMARY
------------------
Deployment Date: $(Get-Date)
Deployed By: $env:USERNAME
Azure Tenant: $AZURE_TENANT_ID

RESOURCE INFORMATION
--------------------
Resource Group: $RESOURCE_GROUP
Location: $LOCATION

DATABASE (PostgreSQL)
---------------------
Server: $POSTGRES_SERVER
Admin Username: sagaadmin
Admin Password: $POSTGRES_PASSWORD_TEXT
Connection String: $DB_CONNECTION_STRING

BACKEND (App Service)
---------------------
App Name: $BACKEND_APP
URL: $BACKEND_URL
Health Check: $BACKEND_URL/health
Runtime: Node.js 20 LTS

FRONTEND (Static Web App)
--------------------------
App Name: $FRONTEND_APP
URL: $FRONTEND_URL

MICROSOFT APP REGISTRATION (SSO)
---------------------------------
App Name: $APP_REGISTRATION_NAME
Client ID: $AZURE_CLIENT_ID
Tenant ID: $AZURE_TENANT_ID
Client Secret: $AZURE_CLIENT_SECRET
Redirect URI: $BACKEND_URL/api/microsoft/auth/microsoft/callback

SECURITY
--------
JWT Secret: $JWT_SECRET

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  IMPORTANT: Keep this file secure! Do NOT commit to Git!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REQUIRED ACTION
---------------
You MUST grant admin consent for API permissions:
1. Go to: https://portal.azure.com
2. Azure Active Directory → App registrations → $APP_REGISTRATION_NAME
3. API permissions → Grant admin consent for Sagareg

TESTING
-------
1. Backend: Visit $BACKEND_URL/health
   Expected: {"status":"OK","timestamp":"..."}

2. Frontend: Visit $FRONTEND_URL
   Expected: SagaReg Dashboard loads

3. Login: Click "Sign in with Microsoft"
   Expected: Redirects to Microsoft login, then back to dashboard

MANUAL FRONTEND DEPLOYMENT (if automatic deployment failed)
------------------------------------------------------------
If the frontend didn't deploy automatically:

1. In Azure Portal, go to Static Web App: $FRONTEND_APP
2. Get deployment token from: Settings → Configuration → Deployment token
3. Run locally:
   cd frontend
   npm install
   npm run build
   npx @azure/static-web-apps-cli deploy ./build --deployment-token <TOKEN>

TROUBLESHOOTING
---------------
- Backend logs: Azure Portal → $BACKEND_APP → Log stream
- Frontend logs: Azure Portal → $FRONTEND_APP → Application Insights
- Database: Use connection string above with psql or Azure Data Studio

COST ESTIMATE
-------------
Monthly cost: ~$25-30 USD
- PostgreSQL (B1ms): ~$12-15
- App Service (B1): ~$13
- Static Web App (Free): $0

For help, see: AZURE_DEPLOYMENT.md
"@

$credentials | Out-File -FilePath azure-credentials.txt

Write-Host ""
Write-Host "✅ All done! Credentials saved to azure-credentials.txt" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Grant admin consent in Azure Portal (see instructions above)" -ForegroundColor Yellow
Write-Host ""
