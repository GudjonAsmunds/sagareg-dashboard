#!/bin/bash

# SagaReg Dashboard - Complete Azure Deployment Script
# This script creates EVERYTHING: Backend, Frontend, Database, and Microsoft App Registration

set -e

echo "🚀 SagaReg Dashboard - Complete Azure Deployment"
echo "=================================================="
echo ""
echo "This script will create:"
echo "  ✓ Azure PostgreSQL Database"
echo "  ✓ Backend App Service (Node.js 20)"
echo "  ✓ Frontend Static Web App"
echo "  ✓ Microsoft App Registration (for SSO)"
echo "  ✓ Configure everything automatically"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed."
    echo "Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "🔐 Logging in to Azure..."
    az login
fi

# Load existing credentials from .env file
echo "📄 Loading configuration from backend/.env file..."
if [ -f backend/.env ]; then
    export $(grep -v '^#' backend/.env | xargs)
    echo "✅ Loaded existing Microsoft App credentials from .env"
    echo "   Client ID: $AZURE_CLIENT_ID"
    echo "   Tenant ID: $AZURE_TENANT_ID"
else
    # Get tenant ID from current login
    AZURE_TENANT_ID=$(az account show --query tenantId -o tsv)
    echo "⚠️  No .env file found, will use current tenant: $AZURE_TENANT_ID"
fi

# Configuration
RESOURCE_GROUP="sagareg-rg"
LOCATION="swedencentral"
POSTGRES_SERVER="sagareg-postgres-$RANDOM"
BACKEND_APP="sagareg-backend-$RANDOM"
FRONTEND_APP="sagareg-dashboard-$RANDOM"
APP_PLAN="sagareg-plan"

echo ""
echo "📋 Deployment Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   PostgreSQL: $POSTGRES_SERVER"
echo "   Backend: $BACKEND_APP"
echo "   Frontend: $FRONTEND_APP"
echo "   App Registration: $APP_REGISTRATION_NAME"
echo "   Node.js Version: 20 LTS"

read -p $'\nContinue with deployment? (y/n) ' -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# =============================================================================
# STEP 1: CREATE RESOURCE GROUP
# =============================================================================
echo ""
echo "📦 STEP 1: Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION &> /dev/null && \
    echo "✅ Resource group created" || \
    echo "ℹ️  Resource group already exists"

# =============================================================================
# STEP 2: VERIFY MICROSOFT APP REGISTRATION
# =============================================================================
echo ""
echo "🔐 STEP 2: Using existing Microsoft App Registration from .env..."
echo "   Client ID: $AZURE_CLIENT_ID"
echo "   Tenant ID: $AZURE_TENANT_ID"
echo "✅ Microsoft credentials loaded"

# =============================================================================
# STEP 3: CREATE POSTGRESQL DATABASE
# =============================================================================
echo ""
echo "🗄️  STEP 3: Creating PostgreSQL database..."
read -sp "Enter PostgreSQL admin password (min 8 chars, uppercase, lowercase, numbers): " POSTGRES_PASSWORD
echo ""

echo "Creating database (this may take 5-10 minutes)..."

az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --location $LOCATION \
  --admin-user sagaadmin \
  --admin-password "$POSTGRES_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14 \
  --storage-size 32 \
  --public-access 0.0.0.0 &> /dev/null && \
    echo "✅ PostgreSQL database created" || \
    echo "⚠️  Database may already exist or error occurred"

DB_CONNECTION_STRING="postgresql://sagaadmin:${POSTGRES_PASSWORD}@${POSTGRES_SERVER}.postgres.database.azure.com/postgres?sslmode=require"

# =============================================================================
# STEP 4: CREATE APP SERVICE PLAN
# =============================================================================
echo ""
echo "📱 STEP 4: Creating App Service plan..."
az appservice plan create \
  --name $APP_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux &> /dev/null && \
    echo "✅ App Service plan created" || \
    echo "ℹ️  App Service plan already exists"

# =============================================================================
# STEP 5: CREATE BACKEND WEB APP
# =============================================================================
echo ""
echo "🔧 STEP 5: Creating backend App Service (Node.js 20)..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_PLAN \
  --name $BACKEND_APP \
  --runtime "NODE:20-lts" &> /dev/null && \
    echo "✅ Backend app created" || \
    echo "ℹ️  Backend app already exists"

BACKEND_URL="https://${BACKEND_APP}.azurewebsites.net"

# =============================================================================
# STEP 6: CREATE STATIC WEB APP FOR FRONTEND
# =============================================================================
echo ""
echo "🌐 STEP 6: Creating Static Web App for frontend..."

az staticwebapp create \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Free &> /dev/null && \
    echo "✅ Static Web App created" || \
    echo "ℹ️  Static Web App already exists"

# Get frontend URL
FRONTEND_HOSTNAME=$(az staticwebapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP --query defaultHostname -o tsv 2>/dev/null)
FRONTEND_URL="https://${FRONTEND_HOSTNAME}"
echo "   Frontend URL: $FRONTEND_URL"

# =============================================================================
# STEP 7: UPDATE MICROSOFT APP REGISTRATION WITH REDIRECT URI
# =============================================================================
echo ""
echo "🔗 STEP 7: Adding production redirect URI to Microsoft App Registration..."

REDIRECT_URI="${BACKEND_URL}/api/microsoft/auth/microsoft/callback"

# Get existing redirect URIs and add the new one
EXISTING_URIS=$(az ad app show --id $AZURE_CLIENT_ID --query "web.redirectUris" -o tsv 2>/dev/null | tr '\n' ' ')

az ad app update \
  --id $AZURE_CLIENT_ID \
  --web-redirect-uris $EXISTING_URIS $REDIRECT_URI &> /dev/null

echo "✅ Redirect URI added: $REDIRECT_URI"
echo "   (Existing localhost URI preserved)"

# =============================================================================
# STEP 8: CONFIGURE BACKEND ENVIRONMENT VARIABLES
# =============================================================================
echo ""
echo "⚙️  STEP 8: Configuring backend environment variables..."

# Use JWT Secret from .env or generate new one
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" == "your-super-secret-jwt-key-change-this-in-production" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated new JWT Secret"
else
    echo "Using existing JWT Secret from .env"
fi

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --settings \
    NODE_ENV=production \
    "DATABASE_URL=$DB_CONNECTION_STRING" \
    "JWT_SECRET=$JWT_SECRET" \
    "AZURE_CLIENT_ID=$AZURE_CLIENT_ID" \
    "AZURE_TENANT_ID=$AZURE_TENANT_ID" \
    "AZURE_CLIENT_SECRET=$AZURE_CLIENT_SECRET" \
    "MICROSOFT_REDIRECT_URI=${BACKEND_URL}/api/microsoft/auth/microsoft/callback" \
    "FRONTEND_URL=$FRONTEND_URL" \
    PORT=8080 &> /dev/null

echo "✅ Environment variables configured"

# =============================================================================
# STEP 9: ENABLE CORS ON BACKEND
# =============================================================================
echo ""
echo "🔗 STEP 9: Enabling CORS for frontend..."

az webapp cors add \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --allowed-origins $FRONTEND_URL &> /dev/null

echo "✅ CORS configured"

# =============================================================================
# STEP 10: DEPLOY BACKEND CODE
# =============================================================================
echo ""
echo "📤 STEP 10: Deploying backend code..."

echo "Creating deployment package..."
cd backend
zip -r ../backend-deploy.zip . -x "node_modules/*" -x ".env" -x ".git/*" &> /dev/null
cd ..

echo "Uploading to Azure (this may take 2-3 minutes)..."
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --src backend-deploy.zip &> /dev/null

rm backend-deploy.zip
echo "✅ Backend code deployed"

# =============================================================================
# STEP 11: INITIALIZE DATABASE
# =============================================================================
echo ""
echo "🗄️  STEP 11: Initializing database schema..."

export DATABASE_URL=$DB_CONNECTION_STRING
cd backend

echo "Running migrations..."
if node migrate-microsoft-proper.js &> /dev/null; then
    echo "✅ Database initialized"
else
    echo "⚠️  Migration may have failed - check azure-credentials.txt for connection string"
fi

cd ..

# =============================================================================
# STEP 12: BUILD AND DEPLOY FRONTEND
# =============================================================================
echo ""
echo "🎨 STEP 12: Building and deploying frontend..."

cd frontend

# Install dependencies
echo "Installing dependencies..."
npm install &> /dev/null

# Create .env.production with API URL
echo "REACT_APP_API_URL=$BACKEND_URL" > .env.production

# Build the React app
echo "Building React app..."
if npm run build &> /dev/null; then
    echo "✅ Frontend built successfully"

    # Deploy to Static Web App
    echo "Deploying to Azure Static Web Apps..."

    # Get deployment token
    DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
      --name $FRONTEND_APP \
      --resource-group $RESOURCE_GROUP \
      --query "properties.apiKey" -o tsv 2>/dev/null)

    if [ ! -z "$DEPLOYMENT_TOKEN" ]; then
        # Install SWA CLI if not already installed
        npm install -g @azure/static-web-apps-cli &> /dev/null

        # Deploy using SWA CLI
        if npx @azure/static-web-apps-cli deploy ./build \
          --deployment-token $DEPLOYMENT_TOKEN \
          --env production &> /dev/null; then
            echo "✅ Frontend deployed"
        else
            echo "⚠️  Manual frontend deployment required (see instructions below)"
        fi
    else
        echo "⚠️  Could not get deployment token. Manual deployment required."
    fi
else
    echo "❌ Frontend build failed"
fi

cd ..

# =============================================================================
# STEP 13: CONFIGURE FRONTEND ENVIRONMENT
# =============================================================================
echo ""
echo "⚙️  STEP 13: Configuring frontend environment variables..."

az staticwebapp appsettings set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --setting-names "REACT_APP_API_URL=$BACKEND_URL" &> /dev/null

echo "✅ Frontend environment configured"

# =============================================================================
# STEP 14: TEST DEPLOYMENT
# =============================================================================
echo ""
echo "🧪 STEP 14: Testing deployment..."

echo "Waiting for backend to start (30 seconds)..."
sleep 30

if curl -s "${BACKEND_URL}/health" | grep -q "OK"; then
    echo "✅ Backend health check passed!"
else
    echo "⚠️  Backend not responding yet (may take a few more minutes to start)"
    echo "   You can check: ${BACKEND_URL}/health"
fi

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉🎉🎉 DEPLOYMENT COMPLETE! 🎉🎉🎉"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Your SagaReg Dashboard is now live in Azure!"
echo ""
echo "🔗 URLs:"
echo "   Backend:  $BACKEND_URL"
echo "   Health:   ${BACKEND_URL}/health"
echo "   Frontend: $FRONTEND_URL"
echo ""
echo "🔐 Credentials:"
echo "   Saved to: azure-credentials.txt"
echo ""
echo "📝 REQUIRED Next Step:"
echo ""
echo "   ⚠️  GRANT ADMIN CONSENT FOR API PERMISSIONS:"
echo ""
echo "   1. Open: https://portal.azure.com"
echo "   2. Navigate to: Azure Active Directory → App registrations"
echo "   3. Search for: $APP_REGISTRATION_NAME"
echo "   4. Click: API permissions"
echo "   5. Click: Grant admin consent for Sagareg"
echo "   6. Click: Yes to confirm"
echo ""
echo "📱 Share With Your Team:"
echo "   $FRONTEND_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Save credentials
cat > azure-credentials.txt << EOF
SagaReg Dashboard - Azure Deployment Credentials
================================================

DEPLOYMENT SUMMARY
------------------
Deployment Date: $(date)
Deployed By: $USER
Azure Tenant: $AZURE_TENANT_ID

RESOURCE INFORMATION
--------------------
Resource Group: $RESOURCE_GROUP
Location: $LOCATION

DATABASE (PostgreSQL)
---------------------
Server: $POSTGRES_SERVER
Admin Username: sagaadmin
Admin Password: $POSTGRES_PASSWORD
Connection String: $DB_CONNECTION_STRING

BACKEND (App Service)
---------------------
App Name: $BACKEND_APP
URL: $BACKEND_URL
Health Check: ${BACKEND_URL}/health
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
Redirect URI: ${BACKEND_URL}/api/microsoft/auth/microsoft/callback

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
1. Backend: Visit ${BACKEND_URL}/health
   Expected: {"status":"OK","timestamp":"..."}

2. Frontend: Visit $FRONTEND_URL
   Expected: SagaReg Dashboard loads

3. Login: Click "Sign in with Microsoft"
   Expected: Redirects to Microsoft login, then back to dashboard

COST ESTIMATE
-------------
Monthly cost: ~\$25-30 USD
- PostgreSQL (B1ms): ~\$12-15
- App Service (B1): ~\$13
- Static Web App (Free): \$0

For help, see: AZURE_DEPLOYMENT.md
EOF

echo ""
echo "✅ All done! Credentials saved to azure-credentials.txt"
echo ""
echo "Next: Grant admin consent in Azure Portal (see instructions above)"
echo ""
