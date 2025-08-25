# SSL Certificate Application using IP Address
# Temporary solution when DNS is not working

Write-Host "SSL Certificate Application using IP Address" -ForegroundColor Cyan
Write-Host "=============================================="

# ECS IP Address
$ecsIP = "116.62.44.24"

Write-Host "Using ECS IP: $ecsIP" -ForegroundColor Yellow
Write-Host "This is a temporary solution while DNS issues are resolved." -ForegroundColor Yellow

# Check if win-acme is available
$wacsPath = "C:\ssl\win-acme\wacs.exe"
if (-not (Test-Path $wacsPath)) {
    Write-Host "ERROR: win-acme not found. Please run ssl-setup-fixed-for-ecs.ps1 first" -ForegroundColor Red
    exit 1
}

# Create IP-based certificate script
$ipCertScript = @"
@echo off
echo Applying for SSL certificate using IP address...
cd /d "C:\ssl\win-acme"

echo.
echo WARNING: This is a temporary solution
echo IP-based certificates have limitations
echo.

echo Attempting certificate for IP: $ecsIP
wacs.exe --target manual --host $ecsIP --validation selfhosting --validationport 80 --emailaddress admin@wwwcn.uk --accepttos

if errorlevel 1 (
    echo.
    echo IP-based certificate failed.
    echo This method has limitations and may not work.
    echo.
    echo Please fix DNS configuration instead:
    echo 1. Check Cloudflare Zone status
    echo 2. Verify Name Servers point to Cloudflare
    echo 3. Wait for DNS propagation
    echo.
    pause
) else (
    echo.
    echo IP-based certificate application completed!
    echo Note: This certificate will only work for IP access
    echo.
)

pause
"@

$ipCertScript | Out-File -FilePath "C:\ssl\apply-cert-ip.bat" -Encoding ASCII
Write-Host "Created IP-based certificate script: C:\ssl\apply-cert-ip.bat" -ForegroundColor Green

Write-Host ""
Write-Host "IMPORTANT NOTES:" -ForegroundColor Red
Write-Host "=================" -ForegroundColor Red
Write-Host "1. IP-based certificates have severe limitations" -ForegroundColor Yellow
Write-Host "2. Browsers will show security warnings" -ForegroundColor Yellow
Write-Host "3. This is only a temporary workaround" -ForegroundColor Yellow
Write-Host "4. You MUST fix the DNS configuration" -ForegroundColor Yellow

Write-Host ""
Write-Host "DNS Configuration Steps:" -ForegroundColor Cyan
Write-Host "1. Login to your domain registrar" -ForegroundColor White
Write-Host "2. Set Name Servers to Cloudflare:" -ForegroundColor White
Write-Host "   - ns1.cloudflare.com" -ForegroundColor Gray
Write-Host "   - ns2.cloudflare.com" -ForegroundColor Gray
Write-Host "3. Wait 24-48 hours for DNS propagation" -ForegroundColor White
Write-Host "4. Verify Zone status is 'Active' in Cloudflare" -ForegroundColor White

Write-Host ""
Write-Host "Run IP certificate (temporary): C:\ssl\apply-cert-ip.bat" -ForegroundColor Yellow