# SSL证书申请操作命令集
# 在Windows ECS上执行的具体指令

Write-Host "🔒 开始SSL证书申请流程" -ForegroundColor Cyan
Write-Host "=" * 50

Write-Host "📍 当前状态检查：" -ForegroundColor Yellow
Write-Host "✅ win-acme工具已安装到：C:\ssl\win-acme\" -ForegroundColor Green
Write-Host "✅ 申请脚本已创建：C:\ssl\apply-ssl.bat" -ForegroundColor Green
Write-Host "✅ 工具文件大小：35.58 MB (完整)" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 第一步：执行证书申请脚本" -ForegroundColor Yellow
Write-Host "在ECS PowerShell中运行以下命令：" -ForegroundColor White
Write-Host "C:\ssl\apply-ssl.bat" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 第二步：选择验证方式" -ForegroundColor Yellow
Write-Host "当win-acme启动后，你将看到验证方式选择：" -ForegroundColor White
Write-Host ""
Write-Host "方案A - HTTP验证（如果端口80可用）：" -ForegroundColor Cyan
Write-Host "  1. 选择 'HTTP validation'" -ForegroundColor White
Write-Host "  2. win-acme将自动处理验证" -ForegroundColor White
Write-Host "  3. 确保端口80开放且无其他服务占用" -ForegroundColor Gray
Write-Host ""
Write-Host "方案B - DNS验证（推荐）：" -ForegroundColor Cyan
Write-Host "  1. 选择 'DNS validation'" -ForegroundColor White
Write-Host "  2. win-acme会显示需要添加的TXT记录" -ForegroundColor White
Write-Host "  3. 记录下显示的TXT记录信息" -ForegroundColor White
Write-Host ""

Write-Host "📝 第三步：DNS验证配置（如选择DNS验证）" -ForegroundColor Yellow
Write-Host "1. 登录Cloudflare Dashboard：https://dash.cloudflare.com" -ForegroundColor White
Write-Host "2. 选择域名：wwwcn.uk" -ForegroundColor White
Write-Host "3. 进入：DNS > Records" -ForegroundColor White
Write-Host "4. 点击 'Add record'" -ForegroundColor White
Write-Host "5. 填写TXT记录：" -ForegroundColor White
Write-Host "   Type: TXT" -ForegroundColor Gray
Write-Host "   Name: _acme-challenge" -ForegroundColor Gray
Write-Host "   Content: (win-acme提供的验证值)" -ForegroundColor Gray
Write-Host "   TTL: Auto" -ForegroundColor Gray
Write-Host ""

Write-Host "⏰ 第四步：等待验证完成" -ForegroundColor Yellow
Write-Host "1. DNS记录添加后等待1-5分钟" -ForegroundColor White
Write-Host "2. 验证DNS传播：" -ForegroundColor White
Write-Host "   nslookup -type=TXT _acme-challenge.wwwcn.uk 8.8.8.8" -ForegroundColor Green
Write-Host "3. 在win-acme中按回车继续" -ForegroundColor White
Write-Host ""

Write-Host "📂 第五步：检查证书文件" -ForegroundColor Yellow
Write-Host "申请成功后，证书将保存在：" -ForegroundColor White
Write-Host "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\wwwcn.uk\" -ForegroundColor Green
Write-Host "包含文件：" -ForegroundColor White
Write-Host "  - cert.pem (证书文件)" -ForegroundColor Gray
Write-Host "  - key.pem (私钥文件)" -ForegroundColor Gray
Write-Host "  - chain.pem (证书链)" -ForegroundColor Gray
Write-Host "  - fullchain.pem (完整证书链)" -ForegroundColor Gray
Write-Host ""

Write-Host "🎯 Cloudflare配置信息：" -ForegroundColor Cyan
Write-Host "Zone ID: 8ad887047518bc2772572ade96309c55" -ForegroundColor White
Write-Host "域名: wwwcn.uk, api.wwwcn.uk, www.wwwcn.uk" -ForegroundColor White
Write-Host "ECS IP: 116.62.44.24" -ForegroundColor White
Write-Host ""

Write-Host "❗ 重要提醒：" -ForegroundColor Red
Write-Host "1. 确保域名已解析到ECS IP地址" -ForegroundColor White
Write-Host "2. HTTP验证需要端口80可访问" -ForegroundColor White
Write-Host "3. DNS验证更安全，推荐使用" -ForegroundColor White
Write-Host "4. 证书申请可能需要几分钟时间" -ForegroundColor White