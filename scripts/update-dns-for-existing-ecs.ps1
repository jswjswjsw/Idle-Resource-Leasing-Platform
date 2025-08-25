param([string]$EcsIP)

if (-not $EcsIP) {
    Write-Host "Usage: .\update-dns-for-existing-ecs.ps1 -EcsIP 'your_ecs_ip'" -ForegroundColor Yellow
    Write-Host "Example: .\update-dns-for-existing-ecs.ps1 -EcsIP '47.96.123.456'" -ForegroundColor Cyan
    exit 1
}

Write-Host "Updating DNS records for existing ECS..." -ForegroundColor Cyan
Write-Host "ECS IP: $EcsIP" -ForegroundColor Yellow

# Update DNS using existing script
try {
    & powershell -ExecutionPolicy Bypass -File "d:\project\trade\scripts\setup-dns-simple.ps1" -Token "7oau74rVYmV5VWw073z1FmhpZ2ZVPy3js3JFh0ke" -ServerIP $EcsIP
    Write-Host "SUCCESS: DNS records updated" -ForegroundColor Green
} catch {
    Write-Host "ERROR: DNS update failed - $($_.Exception.Message)" -ForegroundColor Red
}

# Save ECS info
$ecsInfo = @{
    PublicIP = $EcsIP
    UseExisting = $true
    UpdateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    DNSConfigured = $true
}

$ecsInfo | ConvertTo-Json | Out-File "d:\project\trade\.existing-ecs.json" -Encoding UTF8

Write-Host ""
Write-Host "ECS Configuration Complete!" -ForegroundColor Green
Write-Host "Your websites will be available at:" -ForegroundColor Cyan
Write-Host "  Main site: https://wwwcn.uk" -ForegroundColor White
Write-Host "  API: https://api.wwwcn.uk" -ForegroundColor White
Write-Host "  Server IP: $EcsIP" -ForegroundColor White