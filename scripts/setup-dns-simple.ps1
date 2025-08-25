param([string]$Token, [string]$ServerIP)

$ZONE_ID = "8ad887047518bc2772572ade96309c55"
$headers = @{"Authorization" = "Bearer $Token"; "Content-Type" = "application/json"}

Write-Host "Setting up DNS for wwwcn.uk..." -ForegroundColor Cyan
Write-Host "Server IP: $ServerIP" -ForegroundColor Yellow

# 创建API子域名记录
$apiRecord = @{
    type = "A"
    name = "api"
    content = $ServerIP
    proxied = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Method POST -Headers $headers -Body $apiRecord
    if ($response.success) {
        Write-Host "SUCCESS: API subdomain created - api.wwwcn.uk -> $ServerIP" -ForegroundColor Green
    } else {
        Write-Host "API record may already exist" -ForegroundColor Yellow
    }
} catch {
    Write-Host "API record creation: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 更新主域名记录
$existingRecords = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Headers $headers
$mainRecord = $existingRecords.result | Where-Object { $_.name -eq "wwwcn.uk" -and $_.type -eq "A" }

if ($mainRecord) {
    $updateRecord = @{
        type = "A"
        name = "@"
        content = $ServerIP
        proxied = $true
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$($mainRecord.id)" -Method PUT -Headers $headers -Body $updateRecord
        if ($response.success) {
            Write-Host "SUCCESS: Main domain updated - wwwcn.uk -> $ServerIP" -ForegroundColor Green
        }
    } catch {
        Write-Host "Main domain update: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "DNS configuration completed!" -ForegroundColor Green
Write-Host "Your websites:" -ForegroundColor Cyan
Write-Host "  Main: https://wwwcn.uk" -ForegroundColor White
Write-Host "  API:  https://api.wwwcn.uk" -ForegroundColor White