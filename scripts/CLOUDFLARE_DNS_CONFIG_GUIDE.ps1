# Cloudflare DNS配置指南
# SSL证书DNS验证时需要添加的TXT记录

Write-Host "🌐 Cloudflare DNS配置指南" -ForegroundColor Cyan
Write-Host "=" * 50

Write-Host "📋 配置信息：" -ForegroundColor Yellow
Write-Host "域名: wwwcn.uk" -ForegroundColor White
Write-Host "Zone ID: 8ad887047518bc2772572ade96309c55" -ForegroundColor White
Write-Host "Dashboard: https://dash.cloudflare.com/8ad887047518bc2772572ade96309c55" -ForegroundColor White

Write-Host ""
Write-Host "🔍 当前DNS记录检查：" -ForegroundColor Yellow
Write-Host "需要确保以下A记录已正确配置：" -ForegroundColor White
Write-Host ""

$dnsRecords = @(
    @{Name="@"; Type="A"; Value="116.62.44.24"; Description="主域名"},
    @{Name="www"; Type="A"; Value="116.62.44.24"; Description="www子域名"},
    @{Name="api"; Type="A"; Value="116.62.44.24"; Description="API子域名"}
)

foreach ($record in $dnsRecords) {
    Write-Host "记录名称: $($record.Name)" -ForegroundColor Green
    Write-Host "记录类型: $($record.Type)" -ForegroundColor Green
    Write-Host "记录值: $($record.Value)" -ForegroundColor Green
    Write-Host "说明: $($record.Description)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "🔒 SSL证书DNS验证步骤：" -ForegroundColor Yellow
Write-Host ""
Write-Host "第1步：运行SSL申请命令" -ForegroundColor Cyan
Write-Host "C:\ssl\apply-ssl.bat" -ForegroundColor Green
Write-Host ""
Write-Host "第2步：选择DNS验证方式" -ForegroundColor Cyan
Write-Host "- 选择 'dns-01' 或 'DNS validation'" -ForegroundColor White
Write-Host "- win-acme会显示需要添加的TXT记录" -ForegroundColor White
Write-Host ""
Write-Host "第3步：记录TXT验证信息" -ForegroundColor Cyan
Write-Host "win-acme会显示类似信息：" -ForegroundColor White
Write-Host "Domain: _acme-challenge.wwwcn.uk" -ForegroundColor Gray
Write-Host "Type: TXT" -ForegroundColor Gray
Write-Host "Value: (一长串随机字符)" -ForegroundColor Gray
Write-Host ""
Write-Host "第4步：在Cloudflare中添加TXT记录" -ForegroundColor Cyan
Write-Host "1. 登录 https://dash.cloudflare.com" -ForegroundColor White
Write-Host "2. 选择域名 'wwwcn.uk'" -ForegroundColor White
Write-Host "3. 进入 'DNS' > 'Records'" -ForegroundColor White
Write-Host "4. 点击 'Add record'" -ForegroundColor White
Write-Host "5. 填写以下信息：" -ForegroundColor White
Write-Host "   Type: TXT" -ForegroundColor Green
Write-Host "   Name: _acme-challenge" -ForegroundColor Green
Write-Host "   Content: (复制win-acme提供的验证值)" -ForegroundColor Green
Write-Host "   TTL: Auto" -ForegroundColor Green
Write-Host "   Proxy status: DNS only (灰色云朵)" -ForegroundColor Green
Write-Host "6. 点击 'Save'" -ForegroundColor White
Write-Host ""
Write-Host "第5步：验证DNS传播" -ForegroundColor Cyan
Write-Host "等待1-5分钟，然后验证：" -ForegroundColor White
Write-Host "nslookup -type=TXT _acme-challenge.wwwcn.uk 8.8.8.8" -ForegroundColor Green
Write-Host ""
Write-Host "第6步：在win-acme中继续" -ForegroundColor Cyan
Write-Host "确认TXT记录已添加并传播后，在win-acme中按回车继续" -ForegroundColor White
Write-Host ""

Write-Host "✅ SSL证书申请成功后的步骤：" -ForegroundColor Green
Write-Host "1. 证书文件将保存到以下位置：" -ForegroundColor White
Write-Host "   C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\wwwcn.uk\" -ForegroundColor Cyan
Write-Host "2. 包含以下文件：" -ForegroundColor White
Write-Host "   - cert.pem (证书文件)" -ForegroundColor Gray
Write-Host "   - key.pem (私钥文件)" -ForegroundColor Gray
Write-Host "   - chain.pem (证书链)" -ForegroundColor Gray
Write-Host "   - fullchain.pem (完整证书链)" -ForegroundColor Gray
Write-Host "3. 启动应用服务（HTTPS模式）" -ForegroundColor White
Write-Host "4. 在Cloudflare中设置SSL模式为'完全(严格)'" -ForegroundColor White

Write-Host ""
Write-Host "🔧 Cloudflare SSL模式配置：" -ForegroundColor Yellow
Write-Host "SSL证书配置完成并验证可访问后：" -ForegroundColor White
Write-Host "1. 进入 Cloudflare Dashboard" -ForegroundColor White
Write-Host "2. 选择域名 'wwwcn.uk'" -ForegroundColor White
Write-Host "3. 进入 'SSL/TLS' > '概述'" -ForegroundColor White
Write-Host "4. 将加密模式设置为: '完全(严格)'" -ForegroundColor Green
Write-Host "5. 启用以下安全功能：" -ForegroundColor White
Write-Host "   - HSTS (HTTP严格传输安全)" -ForegroundColor Gray
Write-Host "   - 始终使用HTTPS" -ForegroundColor Gray
Write-Host "   - 最小TLS版本: 1.2" -ForegroundColor Gray

Write-Host ""
Write-Host "🚨 重要提醒：" -ForegroundColor Red
Write-Host "1. 必须先完成SSL证书配置并确保HTTPS可访问" -ForegroundColor White
Write-Host "2. 只有在源服务器HTTPS正常工作后才能设置'完全(严格)'模式" -ForegroundColor White
Write-Host "3. 过早设置'完全(严格)'模式会导致网站无法访问" -ForegroundColor White
Write-Host "4. DNS记录更改可能需要几分钟时间传播" -ForegroundColor White