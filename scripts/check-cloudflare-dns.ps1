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

Write-Host "Checking Cloudflare DNS Records" -ForegroundColor Cyan
Write-Host "Domain: wwwcn.uk" -ForegroundColor Yellow
Write-Host "Zone ID: $ZONE_ID" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Headers $headers
    
    if ($response.success) {
        Write-Host "SUCCESS: Retrieved DNS records" -ForegroundColor Green
        Write-Host ""
        
        # 预期的记录
        $expectedRecords = @(
            @{Name="wwwcn.uk"; Type="A"; Content="116.62.44.24"; Proxied=$true},
            @{Name="api.wwwcn.uk"; Type="A"; Content="116.62.44.24"; Proxied=$true},
            @{Name="www.wwwcn.uk"; Type="CNAME"; Content="wwwcn.uk"; Proxied=$true}
        )
        
        Write-Host "DNS Records Status:" -ForegroundColor Cyan
        Write-Host ("-" * 60)
        
        foreach ($expected in $expectedRecords) {
            $found = $response.result | Where-Object { 
                $_.name -eq $expected.Name -and $_.type -eq $expected.Type 
            }
            
            if ($found) {
                $proxyStatus = if ($found.proxied) { "Proxied" } else { "DNS Only" }
                $proxyIcon = if ($found.proxied) { "🟡" } else { "⚪" }
                
                Write-Host "✅ $($expected.Type) Record: $($expected.Name)" -ForegroundColor Green
                Write-Host "   Content: $($found.content)" -ForegroundColor White
                Write-Host "   Proxy: $proxyIcon $proxyStatus" -ForegroundColor White
                Write-Host "   TTL: $($found.ttl)" -ForegroundColor Gray
                Write-Host ""
            } else {
                Write-Host "❌ Missing: $($expected.Type) $($expected.Name)" -ForegroundColor Red
                Write-Host ""
            }
        }
        
        # 显示所有记录
        Write-Host "All DNS Records on Cloudflare:" -ForegroundColor Yellow
        Write-Host ("-" * 60)
        
        foreach ($record in $response.result) {
            $proxyStatus = if ($record.proxied) { "🟡 Proxied" } else { "⚪ DNS Only" }
            Write-Host "$($record.type) | $($record.name) | $($record.content) | $proxyStatus" -ForegroundColor White
        }
        
    } else {
        Write-Host "ERROR: Failed to retrieve DNS records" -ForegroundColor Red
        $response.errors | ForEach-Object {
            Write-Host "  Error $($_.code): $($_.message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "ERROR: API request failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Cyan
Write-Host "• Main site: https://wwwcn.uk" -ForegroundColor White
Write-Host "• API endpoint: https://api.wwwcn.uk" -ForegroundColor White  
Write-Host "• WWW redirect: https://www.wwwcn.uk -> https://wwwcn.uk" -ForegroundColor White
Write-Host "• Server IP: 116.62.44.24" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy application to ECS server" -ForegroundColor White
Write-Host "2. Configure Nginx and SSL" -ForegroundColor White
Write-Host "3. Test website access" -ForegroundColor White