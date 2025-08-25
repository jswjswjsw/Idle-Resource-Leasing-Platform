# 当前必须执行的任务 - ECS上运行
# 这些是你现在需要在ECS服务器PowerShell中输入的确切命令

Write-Host "🎯 当前必须执行的任务" -ForegroundColor Red
Write-Host "=" * 50

Write-Host "⚡ 任务1：SSL证书申请（立即执行）" -ForegroundColor Yellow
Write-Host "在ECS PowerShell中运行："
Write-Host "C:\ssl\apply-ssl.bat" -ForegroundColor Green
Write-Host ""
Write-Host "操作步骤："
Write-Host "1. 启动后会看到win-acme菜单"
Write-Host "2. 选择 'N' 创建新证书"
Write-Host "3. 选择 'M' 手动输入域名"
Write-Host "4. 输入域名: wwwcn.uk,api.wwwcn.uk,www.wwwcn.uk"
Write-Host "5. 选择验证方式时选择 'dns-01' (DNS验证)"
Write-Host "6. 记录显示的TXT记录信息"
Write-Host ""

Write-Host "⚡ 任务2：配置环境变量（SSL申请完成后）" -ForegroundColor Yellow  
Write-Host "在ECS PowerShell中运行："
Write-Host 'Set-Location "C:\www\trade-platform"' -ForegroundColor Green
Write-Host ""
Write-Host "# 创建后端环境变量"
Write-Host '@"
PORT=5000
NODE_ENV=production
DATABASE_URL="file:./dev.db"
JWT_SECRET=TradeP1atform2024SuperSecretKey!@#$
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://wwwcn.uk
SSL_ENABLED=true
SSL_CERT_PATH=C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/wwwcn.uk/cert.pem
SSL_KEY_PATH=C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/wwwcn.uk/key.pem
"@ | Out-File -FilePath "backend\.env" -Encoding UTF8' -ForegroundColor Green
Write-Host ""
Write-Host "# 创建前端环境变量"
Write-Host '@"
REACT_APP_API_URL=https://api.wwwcn.uk
REACT_APP_WS_URL=wss://api.wwwcn.uk
REACT_APP_APP_NAME=Trade Platform
REACT_APP_VERSION=1.0.0
"@ | Out-File -FilePath "frontend\.env" -Encoding UTF8' -ForegroundColor Green
Write-Host ""

Write-Host "⚡ 任务3：防火墙配置（立即执行）" -ForegroundColor Yellow
Write-Host "在ECS PowerShell中运行："
Write-Host 'New-NetFirewallRule -DisplayName "HTTP-80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow' -ForegroundColor Green
Write-Host 'New-NetFirewallRule -DisplayName "HTTPS-443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow' -ForegroundColor Green
Write-Host 'New-NetFirewallRule -DisplayName "Frontend-3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow' -ForegroundColor Green
Write-Host 'New-NetFirewallRule -DisplayName "Backend-5000" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow' -ForegroundColor Green
Write-Host ""

Write-Host "⚡ 任务4：应用构建（环境变量配置后）" -ForegroundColor Yellow
Write-Host "在ECS PowerShell中运行："
Write-Host 'Set-Location "C:\www\trade-platform\backend"' -ForegroundColor Green
Write-Host 'npm install' -ForegroundColor Green
Write-Host 'npm run build' -ForegroundColor Green
Write-Host ""
Write-Host 'Set-Location "..\frontend"' -ForegroundColor Green
Write-Host 'npm install' -ForegroundColor Green
Write-Host 'npm run build' -ForegroundColor Green
Write-Host ""

Write-Host "📋 执行优先级：" -ForegroundColor Cyan
Write-Host "1. 🔴 SSL证书申请 (最高优先级)" -ForegroundColor Red
Write-Host "2. 🟡 防火墙配置 (可同时进行)" -ForegroundColor Yellow  
Write-Host "3. 🟡 环境变量配置 (SSL完成后)" -ForegroundColor Yellow
Write-Host "4. 🟢 应用构建 (环境变量完成后)" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 现在就开始执行第一个任务：" -ForegroundColor Red
Write-Host "C:\ssl\apply-ssl.bat" -ForegroundColor Yellow