param(
    [string]$Token = $env:CLOUDFLARE_API_TOKEN,
    [string]$ServerIP = "116.62.44.24",
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
$DOMAIN = "wwwcn.uk"

Write-Host "Reset Cloudflare DNS Records" -ForegroundColor Cyan
Write-Host "Domain: $DOMAIN" -ForegroundColor Yellow
Write-Host "Server IP: $ServerIP" -ForegroundColor Yellow
Write-Host "Zone ID: $ZONE_ID" -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

# Step 1: Get existing DNS records
Write-Host "Step 1: Getting existing DNS records..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Headers $headers
    
    if ($response.success) {
        Write-Host "SUCCESS: Retrieved $($response.result.Count) DNS records" -ForegroundColor Green
        
        # Show current records
        Write-Host "`nCurrent DNS records:" -ForegroundColor Cyan
        foreach ($record in $response.result) {
            $proxyStatus = if ($record.proxied) { "Proxied" } else { "DNS Only" }
            Write-Host "  $($record.type) | $($record.name) | $($record.content) | $proxyStatus" -ForegroundColor White
        }
        
    } else {
        Write-Host "ERROR: Failed to get DNS records" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: API request failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Delete existing records for our domain
Write-Host "`nStep 2: Cleaning up existing records..." -ForegroundColor Yellow

$recordsToDelete = $response.result | Where-Object { 
    ($_.name -eq $DOMAIN -or $_.name -eq "api.$DOMAIN" -or $_.name -eq "www.$DOMAIN") -and
    ($_.type -eq "A" -or $_.type -eq "CNAME")
}

foreach ($record in $recordsToDelete) {
    try {
        Write-Host "Deleting: $($record.type) $($record.name) -> $($record.content)" -ForegroundColor Gray
        $deleteResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$($record.id)" -Method DELETE -Headers $headers
        
        if ($deleteResponse.success) {
            Write-Host "  SUCCESS: Deleted $($record.name)" -ForegroundColor Green
        } else {
            Write-Host "  WARNING: Failed to delete $($record.name)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  WARNING: Error deleting $($record.name) - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Step 3: Create new DNS records
Write-Host "`nStep 3: Creating new DNS records..." -ForegroundColor Yellow

$dnsRecords = @(
    @{
        type = "A"
        name = "@"
        content = $ServerIP
        proxied = $true
        comment = "Main domain"
    },
    @{
        type = "A"
        name = "api"
        content = $ServerIP
        proxied = $true
        comment = "API subdomain"
    },
    @{
        type = "CNAME"
        name = "www"
        content = $DOMAIN
        proxied = $true
        comment = "WWW alias"
    }
)

foreach ($record in $dnsRecords) {
    $body = @{
        type = $record.type
        name = $record.name
        content = $record.content
        proxied = $record.proxied
    } | ConvertTo-Json
    
    try {
        Write-Host "Creating: $($record.type) $($record.name) -> $($record.content)" -ForegroundColor Cyan
        $createResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Method POST -Headers $headers -Body $body
        
        if ($createResponse.success) {
            Write-Host "  SUCCESS: Created $($record.name)" -ForegroundColor Green
        } else {
            Write-Host "  ERROR: Failed to create $($record.name)" -ForegroundColor Red
            $createResponse.errors | ForEach-Object {
                Write-Host "    Error: $($_.message)" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "  ERROR: Failed to create $($record.name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 4: Verify new configuration
Write-Host "`nStep 4: Verifying new configuration..." -ForegroundColor Yellow

Start-Sleep -Seconds 3

try {
    $verifyResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Headers $headers
    
    if ($verifyResponse.success) {
        Write-Host "SUCCESS: Verification complete" -ForegroundColor Green
        Write-Host "`nFinal DNS records:" -ForegroundColor Cyan
        
        $relevantRecords = $verifyResponse.result | Where-Object { 
            ($_.name -eq $DOMAIN -or $_.name -eq "api.$DOMAIN" -or $_.name -eq "www.$DOMAIN") -and
            ($_.type -eq "A" -or $_.type -eq "CNAME")
        }
        
        foreach ($record in $relevantRecords) {
            $proxyStatus = if ($record.proxied) { "Proxied" } else { "DNS Only" }
            $statusIcon = if ($record.proxied) { "🟡" } else { "⚪" }
            Write-Host "  $statusIcon $($record.type) | $($record.name) | $($record.content) | $proxyStatus" -ForegroundColor White
        }
    }
} catch {
    Write-Host "WARNING: Verification failed - $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n" + "=" * 60 -ForegroundColor Gray
Write-Host "DNS Reset Complete!" -ForegroundColor Green
Write-Host "`nYour websites:" -ForegroundColor Cyan
Write-Host "  Main site: https://$DOMAIN" -ForegroundColor White
Write-Host "  API: https://api.$DOMAIN" -ForegroundColor White
Write-Host "  WWW redirect: https://www.$DOMAIN -> https://$DOMAIN" -ForegroundColor White
Write-Host "  Server IP: $ServerIP" -ForegroundColor White
Write-Host "`nDNS propagation may take a few minutes to hours globally." -ForegroundColor Yellow
Write-Host "Cloudflare typically propagates faster than other DNS providers." -ForegroundColor Yellow