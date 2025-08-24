# SSL Certificate Setup Script for Windows ECS
# Let's Encrypt Free SSL Certificate Configuration

Write-Host "SSL Certificate Setup for Windows ECS" -ForegroundColor Cyan
Write-Host "======================================="

# Check admin privileges
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: Administrator privileges required" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host "Administrator privileges confirmed" -ForegroundColor Green

# Create SSL working directory
$sslDir = "C:\ssl"
if (-not (Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir -Force | Out-Null
    Write-Host "Created SSL directory: $sslDir" -ForegroundColor Green
}

# Download and setup win-acme tool
Write-Host ""
Write-Host "Setting up win-acme tool..." -ForegroundColor Yellow

$wacsUrl = "https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.pluggable.zip"
$wacsZip = "$sslDir\win-acme.zip"
$wacsDir = "$sslDir\win-acme"

try {
    # Clean previous installation
    if (Test-Path $wacsZip) { Remove-Item $wacsZip -Force }
    if (Test-Path $wacsDir) { Remove-Item $wacsDir -Recurse -Force }
    
    # Download win-acme
    Write-Host "Downloading win-acme tool..." -ForegroundColor White
    Invoke-WebRequest -Uri $wacsUrl -OutFile $wacsZip -UseBasicParsing
    
    # Extract
    Write-Host "Extracting win-acme..." -ForegroundColor White
    Expand-Archive -Path $wacsZip -DestinationPath $wacsDir -Force
    
    Write-Host "win-acme setup completed successfully" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: Failed to setup win-acme: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Manual download required from: https://github.com/win-acme/win-acme/releases" -ForegroundColor Yellow
    exit 1
}

# Create certificate application script
Write-Host ""
Write-Host "Creating certificate application script..." -ForegroundColor Yellow

$certScript = @"
@echo off
echo Starting SSL Certificate Application...
cd /d "$wacsDir"

echo.
echo Domain Information:
echo - Primary: wwwcn.uk
echo - API: api.wwwcn.uk  
echo - WWW: www.wwwcn.uk
echo.

echo Running win-acme certificate application...
wacs.exe --target manual --host wwwcn.uk,api.wwwcn.uk,www.wwwcn.uk --validation dns --emailaddress admin@wwwcn.uk --accepttos

if errorlevel 1 (
    echo.
    echo Certificate application failed.
    echo Please check the DNS TXT records in Cloudflare.
    echo.
    pause
) else (
    echo.
    echo Certificate application completed successfully!
    echo Certificates saved to: %PROGRAMDATA%\win-acme\httpsacme-v02.api.letsencrypt.org
    echo.
    pause
)
"@

$certScript | Out-File -FilePath "$sslDir\apply-cert.bat" -Encoding ASCII
Write-Host "Certificate application script created: $sslDir\apply-cert.bat" -ForegroundColor Green

# Configure firewall rules
Write-Host ""
Write-Host "Configuring Windows Firewall..." -ForegroundColor Yellow

$firewallRules = @(
    @{Name="HTTP-80"; Port=80},
    @{Name="HTTPS-443"; Port=443},
    @{Name="Frontend-3000"; Port=3000},
    @{Name="Backend-5000"; Port=5000}
)

foreach ($rule in $firewallRules) {
    try {
        $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
        if (-not $existing) {
            New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Protocol TCP -LocalPort $rule.Port -Action Allow | Out-Null
            Write-Host "Firewall rule added: Port $($rule.Port)" -ForegroundColor Green
        } else {
            Write-Host "Firewall rule exists: Port $($rule.Port)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "Warning: Could not configure firewall for port $($rule.Port)" -ForegroundColor Yellow
    }
}

# Create environment variables for project
Write-Host ""
Write-Host "Setting up environment variables..." -ForegroundColor Yellow

# Backend environment variables
$backendEnvContent = @"
PORT=5000
NODE_ENV=production
DATABASE_URL=file:./dev.db
JWT_SECRET=TradeP1atform2024SuperSecretKey
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://wwwcn.uk
SSL_ENABLED=true
SSL_CERT_PATH=C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/wwwcn.uk/cert.pem
SSL_KEY_PATH=C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/wwwcn.uk/key.pem
"@

# Frontend environment variables  
$frontendEnvContent = @"
REACT_APP_API_URL=https://api.wwwcn.uk
REACT_APP_WS_URL=wss://api.wwwcn.uk
REACT_APP_APP_NAME=Trade Platform
REACT_APP_VERSION=1.0.0
"@

# Save environment files
try {
    $backendEnvContent | Out-File -FilePath "backend\.env" -Encoding UTF8 -Force
    Write-Host "Backend environment variables configured" -ForegroundColor Green
    
    $frontendEnvContent | Out-File -FilePath "frontend\.env" -Encoding UTF8 -Force  
    Write-Host "Frontend environment variables configured" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not create environment files" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "SSL Setup Completed Successfully!" -ForegroundColor Green
Write-Host "================================="

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run certificate application: $sslDir\apply-cert.bat" -ForegroundColor White
Write-Host "2. Configure DNS TXT records in Cloudflare:" -ForegroundColor White
Write-Host "   - Login: https://dash.cloudflare.com" -ForegroundColor Gray
Write-Host "   - Domain: wwwcn.uk" -ForegroundColor Gray
Write-Host "   - Zone ID: 8ad887047518bc2772572ade96309c55" -ForegroundColor Gray
Write-Host "   - Add TXT record: _acme-challenge" -ForegroundColor Gray
Write-Host "3. Install project dependencies:" -ForegroundColor White
Write-Host "   - cd backend && npm install" -ForegroundColor Gray
Write-Host "   - cd frontend && npm install" -ForegroundColor Gray
Write-Host "4. Start applications with SSL support" -ForegroundColor White

Write-Host ""
Write-Host "Important Files Created:" -ForegroundColor Yellow
Write-Host "- SSL tools: $wacsDir" -ForegroundColor White
Write-Host "- Certificate script: $sslDir\apply-cert.bat" -ForegroundColor White
Write-Host "- Backend config: backend\.env" -ForegroundColor White
Write-Host "- Frontend config: frontend\.env" -ForegroundColor White