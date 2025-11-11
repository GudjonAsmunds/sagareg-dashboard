#!/bin/bash

# SagaReg Dashboard - Azure Deployment Script
# This script helps you deploy the application to Azure

set -e

echo "🚀 SagaReg Dashboard - Azure Deployment"
echo "========================================"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "🔐 Logging in to Azure..."
    az login
fi

# Configuration
RESOURCE_GROUP="sagareg-rg"
LOCATION="westeurope"
POSTGRES_SERVER="sagareg-postgres"
BACKEND_APP="sagareg-backend"
FRONTEND_APP="sagareg-dashboard"
APP_PLAN="sagareg-plan"

echo ""
echo "📋 Deployment Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   PostgreSQL: $POSTGRES_SERVER"
echo "   Backend: $BACKEND_APP"
echo "   Frontend: $FRONTEND_APP"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Step 1: Create Resource Group
echo ""
echo "📦 Step 1: Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION || echo "Resource group already exists"

# Step 2: Create PostgreSQL Database
echo ""
echo "🗄️  Step 2: Creating PostgreSQL database..."
echo "⚠️  Please enter a secure admin password when prompted"
read -sp "PostgreSQL admin password: " POSTGRES_PASSWORD
echo ""

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
  --public-access 0.0.0.0 \
  || echo "PostgreSQL server already exists"

# Get connection string
DB_CONNECTION_STRING="postgresql://sagaadmin:${POSTGRES_PASSWORD}@${POSTGRES_SERVER}.postgres.database.azure.com/postgres?sslmode=require"
echo "✅ Database connection string configured"

# Step 3: Create App Service Plan
echo ""
echo "📱 Step 3: Creating App Service plan..."
az appservice plan create \
  --name $APP_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux \
  || echo "App Service plan already exists"

# Step 4: Create Backend Web App
echo ""
echo "🔧 Step 4: Creating backend App Service..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_PLAN \
  --name $BACKEND_APP \
  --runtime "NODE|18-lts" \
  || echo "Backend app already exists"

# Step 5: Configure Backend Environment Variables
echo ""
echo "⚙️  Step 5: Configuring backend environment variables..."
echo "Please provide the following values:"

read -p "JWT Secret (press Enter to generate): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT Secret: $JWT_SECRET"
fi

read -p "Azure Client ID (from Microsoft App Registration): " AZURE_CLIENT_ID
read -p "Azure Tenant ID: " AZURE_TENANT_ID
read -sp "Azure Client Secret: " AZURE_CLIENT_SECRET
echo ""

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="$DB_CONNECTION_STRING" \
    JWT_SECRET="$JWT_SECRET" \
    AZURE_CLIENT_ID="$AZURE_CLIENT_ID" \
    AZURE_TENANT_ID="$AZURE_TENANT_ID" \
    AZURE_CLIENT_SECRET="$AZURE_CLIENT_SECRET" \
    MICROSOFT_REDIRECT_URI="https://${BACKEND_APP}.azurewebsites.net/api/microsoft/auth/microsoft/callback" \
    PORT=8080

echo "✅ Backend configured"

# Step 6: Deploy Backend Code
echo ""
echo "📤 Step 6: Deploying backend code..."
cd backend
zip -r ../backend.zip . -x "node_modules/*" -x ".env"
cd ..

az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --src backend.zip

rm backend.zip
echo "✅ Backend deployed"

# Step 7: Get Backend URL
BACKEND_URL="https://${BACKEND_APP}.azurewebsites.net"
echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Backend Health: $BACKEND_URL/health"
echo ""
echo "📝 Next Steps:"
echo "1. Update Microsoft App Registration redirect URI to: $BACKEND_URL/api/microsoft/auth/microsoft/callback"
echo "2. Deploy frontend using Azure Static Web Apps (see AZURE_DEPLOYMENT.md)"
echo "3. Run database migrations on Azure database"
echo "4. Test the application"
echo ""
echo "💾 Save these values:"
echo "   DATABASE_URL: $DB_CONNECTION_STRING"
echo "   BACKEND_URL: $BACKEND_URL"
echo "   JWT_SECRET: $JWT_SECRET"
