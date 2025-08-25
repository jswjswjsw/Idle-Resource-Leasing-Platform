param([string]$Domain = "wwwcn.uk")

Write-Host "检查所有子域名的SSL配置状态" -ForegroundColor Cyan
Write-Host "=" * 50

$subdomains = @(
    $Domain,
    "api.$Domain", 
    "www.$Domain"
)

$allSecure = $true

foreach ($subdomain in $subdomains) {
    Write-Host "检查: $subdomain" -ForegroundColor Yellow
    
    try {
        # 检查HTTPS访问
        $response = Invoke-WebRequest -Uri "https://$subdomain" -Method Head -TimeoutSec 10 -ErrorAction Stop
        Write-Host "  ✅ HTTPS访问正常 (状态: $($response.StatusCode))" -ForegroundColor Green
        
        # 检查SSL证书
        $uri = [System.Uri]"https://$subdomain"
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect($uri.Host, 443)
        $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream())
        $sslStream.AuthenticateAsClient($uri.Host)
        
        $cert = $sslStream.RemoteCertificate
        $certExpiry = [System.DateTime]::Parse($cert.GetExpirationDateString())
        
        Write-Host "  ✅ SSL证书有效 (到期: $($certExpiry.ToString('yyyy-MM-dd')))" -ForegroundColor Green
        
        $sslStream.Close()
        $tcpClient.Close()
        
    } catch {
        Write-Host "  ❌ SSL配置有问题: $($_.Exception.Message)" -ForegroundColor Red
        $allSecure = $false
    }
    
    Write-Host ""
}

Write-Host "🎯 includeSubDomains 配置建议:" -ForegroundColor Cyan

if ($allSecure) {
    Write-Host "✅ 建议启用 includeSubDomains" -ForegroundColor Green
    Write-Host "   所有子域名都正确配置了HTTPS" -ForegroundColor White
} else {
    Write-Host "⚠️ 暂时不建议启用 includeSubDomains" -ForegroundColor Yellow
    Write-Host "   部分子域名SSL配置有问题，先修复后再启用" -ForegroundColor White
}

Write-Host ""
Write-Host "📋 HSTS配置建议总结:" -ForegroundColor Cyan
Write-Host "  启用HSTS: ✅ 推荐" -ForegroundColor Green
Write-Host "  Max-Age: ✅ 12个月 (31536000)" -ForegroundColor Green
Write-Host "  includeSubDomains: $(if($allSecure){'✅ 可以启用'}else{'⚠️ 暂缓启用'})" -ForegroundColor $(if($allSecure){'Green'}else{'Yellow'})
Write-Host "  预加载: ⚠️ 建议暂时不启用" -ForegroundColor Yellow
Write-Host "  无嗅探头: ✅ 推荐启用" -ForegroundColor Green