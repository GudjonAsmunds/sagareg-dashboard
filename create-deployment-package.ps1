# Create a clean deployment package for Azure

Write-Host "Creating clean deployment package..." -ForegroundColor Cyan

$deployFolder = "deploy-temp"
$backendSource = "backend"

# Create temp deployment folder
if (Test-Path $deployFolder) {
    Remove-Item $deployFolder -Recurse -Force
}
New-Item -ItemType Directory -Path $deployFolder | Out-Null

# Copy only necessary files
Write-Host "Copying backend files..." -ForegroundColor White

# Copy main files
Copy-Item "$backendSource\*.js" -Destination $deployFolder
Copy-Item "$backendSource\package.json" -Destination $deployFolder
Copy-Item "$backendSource\web.config" -Destination $deployFolder -ErrorAction SilentlyContinue

# Copy folders
Copy-Item "$backendSource\routes" -Destination "$deployFolder\routes" -Recurse
Copy-Item "$backendSource\services" -Destination "$deployFolder\services" -Recurse
Copy-Item "$backendSource\migrations" -Destination "$deployFolder\migrations" -Recurse -ErrorAction SilentlyContinue

# Create zip
Write-Host "Creating deployment.zip..." -ForegroundColor White
Compress-Archive -Path "$deployFolder\*" -DestinationPath "deployment.zip" -Force

# Cleanup
Remove-Item $deployFolder -Recurse -Force

Write-Host "✅ deployment.zip created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Now deploy using:" -ForegroundColor Yellow
Write-Host "az webapp deploy --resource-group sagareg-rg --name sagareg-backend-23009 --src-path deployment.zip --type zip"
