# 从环境变量获取 Cloudflare 配置
$token = $env:CLOUDFLARE_API_TOKEN
if (-not $token) {
    Write-Host "错误: 请设置环境变量 CLOUDFLARE_API_TOKEN" -ForegroundColor Red
    exit 1
}

$ZONE_ID = $env:CLOUDFLARE_ZONE_ID
if (-not $ZONE_ID) {
    $ZONE_ID = "8ad887047518bc2772572ade96309c55"  # 默认值
    Write-Host "警告: 使用默认 Zone ID，建议设置环境变量 CLOUDFLARE_ZONE_ID" -ForegroundColor Yellow
}

Write-Host "🌐 查看 wwwcn.uk 域名的 DNS 记录" -ForegroundColor Cyan
Write-Host "=" * 50

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Headers $headers
    
    if ($response.success) {
        Write-Host "✅ 成功获取DNS记录" -ForegroundColor Green
        Write-Host ""
        
        if ($response.result.Count -eq 0) {
            Write-Host "📝 当前没有DNS记录" -ForegroundColor Yellow
        } else {
            Write-Host "📋 当前DNS记录列表:" -ForegroundColor Yellow
            Write-Host ""
            
            $response.result | ForEach-Object {
                $proxyStatus = if ($_.proxied) { "🟡 代理启用" } else { "⚪ 仅DNS" }
                Write-Host "类型: $($_.type)" -ForegroundColor White
                Write-Host "名称: $($_.name)" -ForegroundColor Cyan
                Write-Host "内容: $($_.content)" -ForegroundColor Green
                Write-Host "状态: $proxyStatus" -ForegroundColor Yellow
                Write-Host "ID: $($_.id)" -ForegroundColor Gray
                Write-Host "-" * 30
            }
        }
        
        Write-Host ""
        Write-Host "💡 建议的DNS记录配置:" -ForegroundColor Cyan
        Write-Host "  @ (A记录)    -> 您的服务器IP [代理启用]" -ForegroundColor White
        Write-Host "  api (A记录)  -> 您的服务器IP [代理启用]" -ForegroundColor White  
        Write-Host "  www (CNAME)  -> wwwcn.uk [代理启用]" -ForegroundColor White
        
    } else {
        Write-Host "❌ 获取DNS记录失败" -ForegroundColor Red
        $response.errors | ForEach-Object {
            Write-Host "错误 $($_.code): $($_.message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "❌ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
}