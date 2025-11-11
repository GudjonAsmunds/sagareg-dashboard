# SagaReg Dashboard - Azure Deployment Script (PowerShell)
# Run this script to deploy to Azure from Windows

Write-Host "🚀 SagaReg Dashboard - Azure Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

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

# Configuration
$RESOURCE_GROUP = "sagareg-rg"
$LOCATION = "westeurope"
$POSTGRES_SERVER = "sagareg-postgres"
$BACKEND_APP = "sagareg-backend"
$APP_PLAN = "sagareg-plan"

Write-Host ""
Write-Host "📋 Deployment Configuration:" -ForegroundColor Green
Write-Host "   Resource Group: $RESOURCE_GROUP"
Write-Host "   Location: $LOCATION"
Write-Host "   PostgreSQL: $POSTGRES_SERVER"
Write-Host "   Backend: $BACKEND_APP"

$continue = Read-Host "`nContinue with deployment? (y/n)"
if ($continue -ne 'y') {
    exit 0
}

# Step 1: Create Resource Group
Write-Host "`n📦 Step 1: Creating resource group..." -ForegroundColor Cyan
az group create --name $RESOURCE_GROUP --location $LOCATION 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Resource group created" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Resource group already exists" -ForegroundColor Yellow
}

# Step 2: Create PostgreSQL
Write-Host "`n🗄️  Step 2: Creating PostgreSQL database..." -ForegroundColor Cyan
$POSTGRES_PASSWORD = Read-Host "Enter PostgreSQL admin password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($POSTGRES_PASSWORD)
$POSTGRES_PASSWORD_TEXT = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

Write-Host "Creating database (this may take 5-10 minutes)..."
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
  --public-access 0.0.0.0 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL database created" -ForegroundColor Green
} else {
    Write-Host "ℹ️  PostgreSQL server already exists or error occurred" -ForegroundColor Yellow
}

$DB_CONNECTION_STRING = "postgresql://sagaadmin:$POSTGRES_PASSWORD_TEXT@$POSTGRES_SERVER.postgres.database.azure.com/postgres?sslmode=require"

# Step 3: Create App Service Plan
Write-Host "`n📱 Step 3: Creating App Service plan..." -ForegroundColor Cyan
az appservice plan create `
  --name $APP_PLAN `
  --resource-group $RESOURCE_GROUP `
  --sku B1 `
  --is-linux 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App Service plan created" -ForegroundColor Green
} else {
    Write-Host "ℹ️  App Service plan already exists" -ForegroundColor Yellow
}

# Step 4: Create Backend Web App
Write-Host "`n🔧 Step 4: Creating backend App Service..." -ForegroundColor Cyan
az webapp create `
  --resource-group $RESOURCE_GROUP `
  --plan $APP_PLAN `
  --name $BACKEND_APP `
  --runtime "NODE:18-lts" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend app created" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Backend app already exists" -ForegroundColor Yellow
}

# Step 5: Configure Environment Variables
Write-Host "`n⚙️  Step 5: Configuring environment variables..." -ForegroundColor Cyan

# Generate JWT Secret
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "Generated JWT Secret"

$AZURE_CLIENT_ID = Read-Host "Enter Azure Client ID (Microsoft App)"
$AZURE_TENANT_ID = Read-Host "Enter Azure Tenant ID"
$AZURE_CLIENT_SECRET = Read-Host "Enter Azure Client Secret" -AsSecureString
$BSTR2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($AZURE_CLIENT_SECRET)
$AZURE_CLIENT_SECRET_TEXT = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR2)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR2)

$settings = @(
    "NODE_ENV=production",
    "DATABASE_URL=$DB_CONNECTION_STRING",
    "JWT_SECRET=$JWT_SECRET",
    "AZURE_CLIENT_ID=$AZURE_CLIENT_ID",
    "AZURE_TENANT_ID=$AZURE_TENANT_ID",
    "AZURE_CLIENT_SECRET=$AZURE_CLIENT_SECRET_TEXT",
    "MICROSOFT_REDIRECT_URI=https://$BACKEND_APP.azurewebsites.net/api/microsoft/auth/microsoft/callback",
    "PORT=8080"
)

az webapp config appsettings set `
  --resource-group $RESOURCE_GROUP `
  --name $BACKEND_APP `
  --settings $settings

Write-Host "✅ Environment variables configured" -ForegroundColor Green

# Step 6: Deploy Backend
Write-Host "`n📤 Step 6: Deploying backend code..." -ForegroundColor Cyan
Push-Location backend
Compress-Archive -Path * -DestinationPath ../backend.zip -Force
Pop-Location

az webapp deployment source config-zip `
  --resource-group $RESOURCE_GROUP `
  --name $BACKEND_APP `
  --src backend.zip

Remove-Item backend.zip
Write-Host "✅ Backend deployed" -ForegroundColor Green

# Summary
$BACKEND_URL = "https://$BACKEND_APP.azurewebsites.net"

Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Cyan
Write-Host "Health Check: $BACKEND_URL/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update Microsoft App Registration redirect URI to:"
Write-Host "   $BACKEND_URL/api/microsoft/auth/microsoft/callback"
Write-Host "2. Deploy frontend (see QUICKSTART_AZURE.md for Static Web Apps)"
Write-Host "3. Run database migrations on Azure database"
Write-Host "4. Test the application"
Write-Host ""
Write-Host "💾 Credentials saved to: azure-credentials.txt" -ForegroundColor Yellow

# Save credentials
$credentials = @"
SagaReg Dashboard - Azure Credentials
=====================================
Database Connection: $DB_CONNECTION_STRING
Backend URL: $BACKEND_URL
JWT Secret: $JWT_SECRET
Deployment Date: $(Get-Date)
Resource Group: $RESOURCE_GROUP
PostgreSQL Server: $POSTGRES_SERVER

Important: Keep this file secure and don't commit to Git!
"@

$credentials | Out-File -FilePath azure-credentials.txt

Write-Host "`n✅ Deployment script completed!" -ForegroundColor Green
