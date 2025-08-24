# SSL Certificate Application Script - HTTP Validation Method
# For Windows ECS when DNS validation plugin is not available

Write-Host "SSL Certificate Application - HTTP Validation Method" -ForegroundColor Cyan
Write-Host "======================================================="

# Check if win-acme is installed
$wacsPath = "C:\ssl\win-acme\wacs.exe"
if (-not (Test-Path $wacsPath)) {
    Write-Host "ERROR: win-acme not found at $wacsPath" -ForegroundColor Red
    Write-Host "Please run ssl-setup-fixed-for-ecs.ps1 first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found win-acme tool at: $wacsPath" -ForegroundColor Green

# Check if port 80 is available for HTTP validation
Write-Host ""
Write-Host "Checking port 80 availability..." -ForegroundColor Yellow

$port80Process = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
if ($port80Process) {
    Write-Host "WARNING: Port 80 is currently in use" -ForegroundColor Yellow
    $port80Process | ForEach-Object {
        $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  Process: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor White
        }
    }
    Write-Host ""
    Write-Host "For HTTP validation to work, port 80 must be available." -ForegroundColor Yellow
    Write-Host "Please stop the service using port 80 temporarily, or use manual validation." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        Write-Host "Aborted by user" -ForegroundColor Yellow
        exit 0
    }
}

# Create a simple HTTP server directory for validation
$webRoot = "C:\ssl\webroot"
if (-not (Test-Path $webRoot)) {
    New-Item -ItemType Directory -Path $webRoot -Force | Out-Null
    Write-Host "Created web root directory: $webRoot" -ForegroundColor Green
}

# Create index.html for validation
$indexContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>SSL Certificate Validation</title>
</head>
<body>
    <h1>Trade Platform</h1>
    <p>SSL Certificate Validation Page</p>
    <p>Domain: wwwcn.uk</p>
    <p>Server: Windows ECS</p>
</body>
</html>
"@

$indexContent | Out-File -FilePath "$webRoot\index.html" -Encoding UTF8
Write-Host "Created validation page: $webRoot\index.html" -ForegroundColor Green

# Method 1: Try HTTP validation with built-in web server
Write-Host ""
Write-Host "Method 1: Attempting HTTP validation with built-in server..." -ForegroundColor Cyan

$httpValidationScript = @"
@echo off
echo Starting HTTP validation for SSL certificate...
cd /d "C:\ssl\win-acme"

echo Creating certificate with HTTP validation...
wacs.exe --target manual --host wwwcn.uk,api.wwwcn.uk,www.wwwcn.uk --validation selfhosting --validationport 80 --emailaddress admin@wwwcn.uk --accepttos

if errorlevel 1 (
    echo.
    echo HTTP validation failed. Trying alternative method...
    echo.
    
    REM Try with web root validation
    echo Trying webroot validation...
    wacs.exe --target manual --host wwwcn.uk,api.wwwcn.uk,www.wwwcn.uk --validation filesystem --webroot "$webRoot" --emailaddress admin@wwwcn.uk --accepttos
    
    if errorlevel 1 (
        echo.
        echo Automatic validation failed. Manual validation required.
        echo.
        echo Please use one of these options:
        echo 1. Configure IIS or another web server for HTTP validation
        echo 2. Use manual DNS validation method
        echo 3. Contact support for additional assistance
        echo.
        pause
    ) else (
        echo.
        echo Certificate application successful!
        echo.
    )
) else (
    echo.
    echo Certificate application successful!
    echo.
)

echo Checking certificate files...
if exist "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\wwwcn.uk\cert.pem" (
    echo SUCCESS: Certificate files created
    echo Location: C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\wwwcn.uk\
    dir "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\wwwcn.uk\"
) else (
    echo WARNING: Certificate files not found
    echo Please check the win-acme output for errors
)

echo.
pause
"@

$httpValidationScript | Out-File -FilePath "C:\ssl\apply-cert-http.bat" -Encoding ASCII
Write-Host "Created HTTP validation script: C:\ssl\apply-cert-http.bat" -ForegroundColor Green

# Method 2: Manual validation instructions
Write-Host ""
Write-Host "Method 2: Manual validation instructions" -ForegroundColor Cyan
Write-Host "========================================="

$manualScript = @"
@echo off
echo Manual SSL Certificate Application
echo ==================================

cd /d "C:\ssl\win-acme"

echo This will start manual validation process...
echo You will need to:
echo 1. Create verification files as instructed
echo 2. Make them accessible via HTTP on your domain
echo 3. Confirm validation

echo.
echo Starting manual validation...
wacs.exe --target manual --host wwwcn.uk,api.wwwcn.uk,www.wwwcn.uk --validation manual --emailaddress admin@wwwcn.uk --accepttos

echo.
pause
"@

$manualScript | Out-File -FilePath "C:\ssl\apply-cert-manual.bat" -Encoding ASCII
Write-Host "Created manual validation script: C:\ssl\apply-cert-manual.bat" -ForegroundColor Green

Write-Host ""
Write-Host "SSL Certificate Application Scripts Created!" -ForegroundColor Green
Write-Host "=============================================="

Write-Host ""
Write-Host "Available Options:" -ForegroundColor Yellow
Write-Host "1. HTTP Validation (Recommended): C:\ssl\apply-cert-http.bat" -ForegroundColor White
Write-Host "2. Manual Validation: C:\ssl\apply-cert-manual.bat" -ForegroundColor White

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Try HTTP validation first: C:\ssl\apply-cert-http.bat" -ForegroundColor White
Write-Host "2. If HTTP fails, use manual validation" -ForegroundColor White
Write-Host "3. Ensure domain wwwcn.uk points to this server (116.62.44.24)" -ForegroundColor White
Write-Host "4. Port 80 must be accessible from internet" -ForegroundColor White

Write-Host ""
Write-Host "Important Notes:" -ForegroundColor Yellow
Write-Host "- HTTP validation requires port 80 to be accessible" -ForegroundColor White
Write-Host "- Domain must resolve to this server's IP address" -ForegroundColor White
Write-Host "- If validation fails, check DNS resolution and firewall settings" -ForegroundColor White