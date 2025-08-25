# Windows ECS 下一步部署操作指令
# 在ECS服务器上执行的后续步骤

Write-Host "Windows ECS 后续部署步骤" -ForegroundColor Cyan
Write-Host "=" * 50

# 第一步：SSL证书申请（win-acme工具已就绪）
Write-Host "第一步：申请SSL证书" -ForegroundColor Yellow
Write-Host "✅ win-acme工具已安装完成" -ForegroundColor Green
Write-Host "执行证书申请：" -ForegroundColor White
Write-Host "C:\ssl\apply-ssl.bat" -ForegroundColor Green
Write-Host "" 
Write-Host "证书申请选项：" -ForegroundColor Cyan
Write-Host "方案A - HTTP验证（需端口80可用）：" -ForegroundColor White
Write-Host "  - 自动验证，操作简单" -ForegroundColor Gray
Write-Host "  - 需要暂停占用端口80的服务" -ForegroundColor Gray
Write-Host "方案B - DNS验证（推荐）：" -ForegroundColor White 
Write-Host "  - 更安全，不需要开放端口" -ForegroundColor Gray
Write-Host "  - 需要手动在Cloudflare添加TXT记录" -ForegroundColor Gray
Write-Host ""

# 第二步：环境变量配置
Write-Host "第二步：配置环境变量" -ForegroundColor Yellow
Write-Host "执行以下命令：" -ForegroundColor White
Write-Host "Set-Location 'C:\www\trade-platform'" -ForegroundColor Green
Write-Host "Copy-Item 'backend\.env.example' 'backend\.env' -ErrorAction SilentlyContinue" -ForegroundColor Green
Write-Host "Copy-Item 'frontend\.env.example' 'frontend\.env' -ErrorAction SilentlyContinue" -ForegroundColor Green
Write-Host "然后编辑 .env 文件配置实际参数" -ForegroundColor Cyan
Write-Host ""

# 第三步：构建应用
Write-Host "第三步：构建应用" -ForegroundColor Yellow
Write-Host "后端构建：" -ForegroundColor White
Write-Host "Set-Location 'C:\www\trade-platform\backend'" -ForegroundColor Green
Write-Host "npm run build" -ForegroundColor Green
Write-Host ""
Write-Host "前端构建：" -ForegroundColor White
Write-Host "Set-Location 'C:\www\trade-platform\frontend'" -ForegroundColor Green
Write-Host "npm run build" -ForegroundColor Green
Write-Host ""

# 第四步：启动应用
Write-Host "第四步：启动应用" -ForegroundColor Yellow
Write-Host "启动后端：" -ForegroundColor White
Write-Host "Set-Location 'C:\www\trade-platform\backend'" -ForegroundColor Green
Write-Host "npm start" -ForegroundColor Green
Write-Host ""
Write-Host "启动前端（新窗口）：" -ForegroundColor White
Write-Host "Set-Location 'C:\www\trade-platform\frontend'" -ForegroundColor Green
Write-Host "npm start" -ForegroundColor Green
Write-Host ""

# 第五步：验证部署
Write-Host "第五步：验证部署" -ForegroundColor Yellow
Write-Host "测试本地访问：" -ForegroundColor White
Write-Host "Invoke-WebRequest -Uri 'http://localhost:3000' -Method GET" -ForegroundColor Green
Write-Host "Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -Method GET" -ForegroundColor Green
Write-Host ""

# 第六步：配置防火墙
Write-Host "第六步：配置防火墙" -ForegroundColor Yellow
Write-Host "开放必要端口：" -ForegroundColor White
Write-Host "New-NetFirewallRule -DisplayName 'Node-Frontend' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow" -ForegroundColor Green
Write-Host "New-NetFirewallRule -DisplayName 'Node-Backend' -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow" -ForegroundColor Green
Write-Host ""

# 创建完整的操作脚本到ECS
$scriptContent = @'
# SSL证书申请脚本内容
Write-Host "🔒 开始SSL证书申请" -ForegroundColor Cyan
Write-Host "执行命令: C:\ssl\apply-ssl.bat" -ForegroundColor Green
Write-Host "选择DNS验证方式（推荐）" -ForegroundColor Yellow
Write-Host "需要在Cloudflare添加TXT记录" -ForegroundColor Yellow
'@

$scriptContent | Out-File -FilePath "C:\deployment\ssl-apply-guide.ps1" -Encoding UTF8
Write-Host "✅ SSL申请指南已创建: C:\deployment\ssl-apply-guide.ps1" -ForegroundColor Green

Write-Host ""
Write-Host "📋 重要提醒：" -ForegroundColor Cyan
Write-Host "1. SSL证书配置完成后，需要在Cloudflare中设置为'完全(严格)'模式" -ForegroundColor White
Write-Host "2. 确保DNS记录正确指向ECS IP: 116.62.44.24" -ForegroundColor White
Write-Host "3. 环境变量需要配置实际的第三方服务密钥" -ForegroundColor White
Write-Host "4. 生产环境建议使用PM2或Windows服务管理应用进程" -ForegroundColor White