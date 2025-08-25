param(
    [string]$Token = "7oau74rVYmV5VWw073z1FmhpZ2ZVPy3js3JFh0ke",
    [string]$ServerIP = "116.62.44.24"
)

$ZONE_ID = "8ad887047518bc2772572ade96309c55"
$DOMAIN = "wwwcn.uk"

Write-Host "Resetting Cloudflare DNS Records" -ForegroundColor Cyan
Write-Host "Domain: $DOMAIN" -ForegroundColor Yellow
Write-Host "Server IP: $ServerIP" -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

# Get existing records
Write-Host "Getting existing DNS records..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Headers $headers
    
    if ($response.success) {
        Write-Host "SUCCESS: Found $($response.result.Count) records" -ForegroundColor Green
        
        # Delete existing A and CNAME records for our domain
        $recordsToDelete = $response.result | Where-Object { 
            ($_.name -eq $DOMAIN -or $_.name -eq "api.$DOMAIN" -or $_.name -eq "www.$DOMAIN") -and
            ($_.type -eq "A" -or $_.type -eq "CNAME")
        }
        
        Write-Host "Deleting $($recordsToDelete.Count) existing records..." -ForegroundColor Yellow
        foreach ($record in $recordsToDelete) {
            try {
                $deleteResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$($record.id)" -Method DELETE -Headers $headers
                Write-Host "  Deleted: $($record.type) $($record.name)" -ForegroundColor Green
            } catch {
                Write-Host "  Failed to delete: $($record.name)" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "ERROR: Failed to get records" -ForegroundColor Red
    exit 1
}

# Create new records
Write-Host "Creating new DNS records..." -ForegroundColor Yellow

# Main domain A record
$mainRecord = @{
    type = "A"
    name = "@"
    content = $ServerIP
    proxied = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Method POST -Headers $headers -Body $mainRecord
    if ($response.success) {
        Write-Host "SUCCESS: Created main domain A record" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: Failed to create main domain record" -ForegroundColor Red
}

# API subdomain A record
$apiRecord = @{
    type = "A"
    name = "api"
    content = $ServerIP
    proxied = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Method POST -Headers $headers -Body $apiRecord
    if ($response.success) {
        Write-Host "SUCCESS: Created API subdomain A record" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: Failed to create API record" -ForegroundColor Red
}

# WWW CNAME record
$wwwRecord = @{
    type = "CNAME"
    name = "www"
    content = $DOMAIN
    proxied = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Method POST -Headers $headers -Body $wwwRecord
    if ($response.success) {
        Write-Host "SUCCESS: Created WWW CNAME record" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: Failed to create WWW record" -ForegroundColor Red
}

Write-Host ""
Write-Host "DNS Reset Complete!" -ForegroundColor Green
Write-Host "Your websites:" -ForegroundColor Cyan
Write-Host "  Main: https://$DOMAIN" -ForegroundColor White
Write-Host "  API:  https://api.$DOMAIN" -ForegroundColor White
Write-Host "  WWW:  https://www.$DOMAIN (redirects to main)" -ForegroundColor White
Write-Host "  Server IP: $ServerIP" -ForegroundColor White
Write-Host ""
Write-Host "DNS propagation may take a few minutes." -ForegroundColor Yellow
