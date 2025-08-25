# 域名DNS修复指南
# wwwcn.uk 域名解析问题排查和修复

Write-Host "🌐 wwwcn.uk 域名DNS修复指南" -ForegroundColor Cyan
Write-Host "=" * 50

Write-Host "📋 问题诊断清单:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣ 检查域名注册状态" -ForegroundColor White
Write-Host "   • 访问域名注册商网站确认域名是否已注册" -ForegroundColor Gray
Write-Host "   • 检查域名到期时间" -ForegroundColor Gray
Write-Host "   • 确认域名状态为 'Active'" -ForegroundColor Gray

Write-Host ""
Write-Host "2️⃣ 检查域名服务器(NS)设置" -ForegroundColor White
Write-Host "   • 域名应指向Cloudflare的NS服务器:" -ForegroundColor Gray
Write-Host "     - ada.ns.cloudflare.com" -ForegroundColor Green
Write-Host "     - beau.ns.cloudflare.com" -ForegroundColor Green
Write-Host "   • 在域名注册商处修改NS记录" -ForegroundColor Gray

Write-Host ""
Write-Host "3️⃣ 检查Cloudflare DNS记录" -ForegroundColor White
Write-Host "   预期的DNS记录配置:" -ForegroundColor Gray
Write-Host "   A    | @            | 116.62.44.24 | 🟡 Proxied" -ForegroundColor Green
Write-Host "   A    | api          | 116.62.44.24 | 🟡 Proxied" -ForegroundColor Green  
Write-Host "   CNAME| www          | wwwcn.uk     | 🟡 Proxied" -ForegroundColor Green

Write-Host ""
Write-Host "🛠️ 修复步骤:" -ForegroundColor Cyan

Write-Host ""
Write-Host "步骤1: 验证域名注册" -ForegroundColor Yellow
Write-Host "运行WHOIS查询:" -ForegroundColor White
Write-Host "nslookup -type=SOA wwwcn.uk" -ForegroundColor Green
Write-Host "dig wwwcn.uk SOA" -ForegroundColor Green
Write-Host "whois wwwcn.uk" -ForegroundColor Green

Write-Host ""
Write-Host "步骤2: 设置Cloudflare DNS" -ForegroundColor Yellow
Write-Host "使用Cloudflare API或控制台添加DNS记录" -ForegroundColor White

$dnsApiScript = @'
# 使用Cloudflare API添加DNS记录
$ZONE_ID = "8ad887047518bc2772572ade96309c55"
$API_TOKEN = "7oau74rVYmV5VWw073z1FmhpZ2ZVPy3js3JFh0ke"
$SERVER_IP = "116.62.44.24"

$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type" = "application/json"
}

# 添加主域名A记录
$body1 = @{
    type = "A"
    name = "@"
    content = $SERVER_IP
    proxied = $true
    ttl = 1
} | ConvertTo-Json

# 添加API子域名A记录  
$body2 = @{
    type = "A"
    name = "api"
    content = $SERVER_IP
    proxied = $true
    ttl = 1
} | ConvertTo-Json

# 添加WWW CNAME记录
$body3 = @{
    type = "CNAME"
    name = "www"
    content = "wwwcn.uk"
    proxied = $true
    ttl = 1
} | ConvertTo-Json

try {
    Write-Host "添加主域名记录..." -ForegroundColor Yellow
    $result1 = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Headers $headers -Method POST -Body $body1
    
    Write-Host "添加API子域名记录..." -ForegroundColor Yellow  
    $result2 = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Headers $headers -Method POST -Body $body2
    
    Write-Host "添加WWW CNAME记录..." -ForegroundColor Yellow
    $result3 = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Headers $headers -Method POST -Body $body3
    
    Write-Host "✅ DNS记录添加完成!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ DNS记录添加失败: $($_.Exception.Message)" -ForegroundColor Red
}
'@

Write-Host "Cloudflare DNS API脚本:" -ForegroundColor White  
Write-Host $dnsApiScript -ForegroundColor Gray

Write-Host ""
Write-Host "步骤3: 等待DNS传播" -ForegroundColor Yellow
Write-Host "DNS记录更新后需要等待传播，通常需要:" -ForegroundColor White
Write-Host "• 几分钟到24小时不等" -ForegroundColor Gray
Write-Host "• 可以使用不同DNS服务器测试:" -ForegroundColor Gray
Write-Host "  nslookup wwwcn.uk 8.8.8.8" -ForegroundColor Green
Write-Host "  nslookup wwwcn.uk 1.1.1.1" -ForegroundColor Green

Write-Host ""
Write-Host "步骤4: 验证解析结果" -ForegroundColor Yellow
Write-Host "解析成功后应该看到:" -ForegroundColor White
Write-Host "Server: dns.google" -ForegroundColor Green
Write-Host "Address: 8.8.8.8" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "Non-authoritative answer:" -ForegroundColor Green
Write-Host "Name: wwwcn.uk" -ForegroundColor Green
Write-Host "Address: 116.62.44.24" -ForegroundColor Green

Write-Host ""
Write-Host "🚨 常见问题和解决方案:" -ForegroundColor Red

Write-Host ""
Write-Host "问题1: 域名未注册" -ForegroundColor Yellow
Write-Host "解决: 需要先购买域名 wwwcn.uk" -ForegroundColor White
Write-Host "• 可通过 Namecheap、GoDaddy 等注册商购买" -ForegroundColor Gray
Write-Host "• .uk域名需要满足特定要求" -ForegroundColor Gray

Write-Host ""
Write-Host "问题2: NS记录未指向Cloudflare" -ForegroundColor Yellow  
Write-Host "解决: 在域名注册商处修改NS记录" -ForegroundColor White
Write-Host "• 登录域名注册商控制台" -ForegroundColor Gray
Write-Host "• 找到DNS设置或名称服务器设置" -ForegroundColor Gray
Write-Host "• 修改为Cloudflare的NS服务器" -ForegroundColor Gray

Write-Host ""
Write-Host "问题3: Cloudflare Zone配置问题" -ForegroundColor Yellow
Write-Host "解决: 检查Zone ID和API Token" -ForegroundColor White
Write-Host "• Zone ID: 8ad887047518bc2772572ade96309c55" -ForegroundColor Gray
Write-Host "• 确认API Token权限正确" -ForegroundColor Gray

Write-Host ""
Write-Host "🔄 临时解决方案:" -ForegroundColor Cyan
Write-Host "如果域名暂时无法解析，可以:" -ForegroundColor White
Write-Host "1. 直接使用IP地址访问应用" -ForegroundColor Gray
Write-Host "2. 修改本地hosts文件进行测试" -ForegroundColor Gray
Write-Host "3. 使用自签名SSL证书" -ForegroundColor Gray

Write-Host ""
Write-Host "添加到hosts文件 (C:\Windows\System32\drivers\etc\hosts):" -ForegroundColor White
Write-Host "116.62.44.24 wwwcn.uk" -ForegroundColor Green
Write-Host "116.62.44.24 api.wwwcn.uk" -ForegroundColor Green  
Write-Host "116.62.44.24 www.wwwcn.uk" -ForegroundColor Green