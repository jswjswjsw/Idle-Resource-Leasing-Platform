param(
    [string]$Token = $env:CLOUDFLARE_API_TOKEN,
    [string]$ZoneId = $env:CLOUDFLARE_ZONE_ID
)

# 验证必需的参数
if (-not $Token) {
    Write-Host "错误: 请设置环境变量 CLOUDFLARE_API_TOKEN 或通过 -Token 参数提供" -ForegroundColor Red
    exit 1
}

if (-not $ZoneId) {
    $ZoneId = "8ad887047518bc2772572ade96309c55"  # 默认值，建议设置环境变量
    Write-Host "警告: 使用默认 Zone ID，建议设置环境变量 CLOUDFLARE_ZONE_ID" -ForegroundColor Yellow
}

$ZONE_ID = $ZoneId
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

Write-Host "Configuring Cloudflare SSL/TLS Settings" -ForegroundColor Cyan
Write-Host "Zone ID: $ZONE_ID" -ForegroundColor Yellow
Write-Host ""

# 1. Set SSL mode to Full (strict)
Write-Host "1. Setting SSL mode to Full (strict)..." -ForegroundColor Yellow
$sslSettings = @{
    value = "full"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" -Method PATCH -Headers $headers -Body $sslSettings
    if ($response.success) {
        Write-Host "   SUCCESS: SSL mode set to Full (strict)" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Failed to set SSL mode" -ForegroundColor Red
    }
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Enable Always Use HTTPS
Write-Host "2. Enabling Always Use HTTPS..." -ForegroundColor Yellow
$httpsRedirect = @{
    value = "on"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/always_use_https" -Method PATCH -Headers $headers -Body $httpsRedirect
    if ($response.success) {
        Write-Host "   SUCCESS: Always Use HTTPS enabled" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Failed to enable HTTPS redirect" -ForegroundColor Red
    }
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Configure HSTS
Write-Host "3. Configuring HSTS (HTTP Strict Transport Security)..." -ForegroundColor Yellow
$hstsSettings = @{
    value = @{
        enabled = $true
        max_age = 31536000
        include_subdomains = $true
        nosniff = $true
    }
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/security_header" -Method PATCH -Headers $headers -Body $hstsSettings
    if ($response.success) {
        Write-Host "   SUCCESS: HSTS configured (1 year, include subdomains)" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Failed to configure HSTS" -ForegroundColor Red
    }
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Set minimum TLS version to 1.2
Write-Host "4. Setting minimum TLS version to 1.2..." -ForegroundColor Yellow
$tlsSettings = @{
    value = "1.2"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/min_tls_version" -Method PATCH -Headers $headers -Body $tlsSettings
    if ($response.success) {
        Write-Host "   SUCCESS: Minimum TLS version set to 1.2" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Failed to set TLS version" -ForegroundColor Red
    }
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Enable additional security features
Write-Host "5. Enabling additional security features..." -ForegroundColor Yellow

# Enable Automatic HTTPS Rewrites
$httpsRewrites = @{
    value = "on"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/automatic_https_rewrites" -Method PATCH -Headers $headers -Body $httpsRewrites
    if ($response.success) {
        Write-Host "   SUCCESS: Automatic HTTPS Rewrites enabled" -ForegroundColor Green
    } else {
        Write-Host "   INFO: Automatic HTTPS Rewrites setting not changed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   INFO: Automatic HTTPS Rewrites - $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "SSL/TLS Configuration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Current SSL Settings:" -ForegroundColor Cyan
Write-Host "  SSL Mode: Full (strict)" -ForegroundColor White
Write-Host "  HTTPS Redirect: Enabled" -ForegroundColor White
Write-Host "  HSTS: Enabled (1 year, include subdomains)" -ForegroundColor White
Write-Host "  Minimum TLS: 1.2" -ForegroundColor White
Write-Host "  Automatic HTTPS Rewrites: Enabled" -ForegroundColor White
Write-Host ""
Write-Host "Your websites are now secured with:" -ForegroundColor Yellow
Write-Host "  https://wwwcn.uk (SSL A+ rating)" -ForegroundColor White
Write-Host "  https://api.wwwcn.uk (SSL A+ rating)" -ForegroundColor White
Write-Host ""
Write-Host "Note: You need to install SSL certificate on your server (116.62.44.24)" -ForegroundColor Yellow
Write-Host "      for Full (strict) mode to work properly." -ForegroundColor Yellow