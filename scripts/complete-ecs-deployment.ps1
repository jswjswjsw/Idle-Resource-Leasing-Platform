# ECS完整部署执行脚本
# 包含SSL证书申请、环境配置、应用构建启动的完整流程

Write-Host "🚀 Trade Platform ECS完整部署流程" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host "📋 当前部署状态检查..." -ForegroundColor Yellow

# 检查win-acme工具状态
if (Test-Path "C:\ssl\win-acme\wacs.exe") {
    Write-Host "✅ win-acme工具已安装" -ForegroundColor Green
} else {
    Write-Host "❌ win-acme工具未安装，请先运行SSL工具安装脚本" -ForegroundColor Red
    exit 1
}

# 检查项目目录
if (Test-Path "C:\www\trade-platform") {
    Write-Host "✅ 项目目录存在" -ForegroundColor Green
} else {
    Write-Host "❌ 项目目录不存在，请先运行项目部署脚本" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 执行步骤1: SSL证书申请" -ForegroundColor Cyan
Write-Host "=" * 30

Write-Host "💡 SSL证书申请指导:" -ForegroundColor Yellow
Write-Host "1. 运行命令: C:\ssl\apply-ssl.bat" -ForegroundColor White
Write-Host "2. 推荐选择: DNS验证方式" -ForegroundColor White  
Write-Host "3. 记录TXT验证信息" -ForegroundColor White
Write-Host "4. 在Cloudflare中添加TXT记录" -ForegroundColor White
Write-Host ""

Write-Host "🌐 Cloudflare DNS配置信息:" -ForegroundColor Cyan
Write-Host "Zone ID: 8ad887047518bc2772572ade96309c55" -ForegroundColor White
Write-Host "域名: wwwcn.uk" -ForegroundColor White
Write-Host "记录类型: TXT" -ForegroundColor White
Write-Host "记录名称: _acme-challenge" -ForegroundColor White
Write-Host "记录值: (win-acme提供的验证字符串)" -ForegroundColor White

Write-Host ""
Write-Host "▶️ 现在执行SSL证书申请:" -ForegroundColor Green
Write-Host "C:\ssl\apply-ssl.bat" -ForegroundColor Yellow

# 等待用户确认SSL证书申请完成
Write-Host ""
Read-Host "SSL证书申请完成后，按回车键继续..."

Write-Host ""
Write-Host "🎯 执行步骤2: 环境变量配置" -ForegroundColor Cyan  
Write-Host "=" * 30

# 配置环境变量
Set-Location "C:\www\trade-platform"

# 后端环境变量
Write-Host "📝 配置后端环境变量..." -ForegroundColor Yellow
$backendEnv = @"
# 服务器配置
PORT=5000
NODE_ENV=production

# 数据库配置  
DATABASE_URL="file:./dev.db"

# JWT配置
JWT_SECRET=TradeP1atform2024SuperSecretKey!@#$
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=https://wwwcn.uk

# SSL配置
SSL_ENABLED=true
SSL_CERT_PATH=C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/wwwcn.uk/cert.pem
SSL_KEY_PATH=C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/wwwcn.uk/key.pem
"@

$backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8
Write-Host "✅ 后端环境变量配置完成" -ForegroundColor Green

# 前端环境变量
Write-Host "📝 配置前端环境变量..." -ForegroundColor Yellow
$frontendEnv = @"
# API配置
REACT_APP_API_URL=https://api.wwwcn.uk
REACT_APP_WS_URL=wss://api.wwwcn.uk

# 应用配置
REACT_APP_APP_NAME=Trade Platform
REACT_APP_VERSION=1.0.0
"@

$frontendEnv | Out-File -FilePath "frontend\.env" -Encoding UTF8
Write-Host "✅ 前端环境变量配置完成" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 执行步骤3: 防火墙配置" -ForegroundColor Cyan
Write-Host "=" * 30

try {
    New-NetFirewallRule -DisplayName "HTTP-80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "HTTPS-443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue  
    New-NetFirewallRule -DisplayName "Frontend-3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Backend-5000" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow -ErrorAction SilentlyContinue
    Write-Host "✅ 防火墙规则配置完成" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 防火墙配置可能需要管理员权限" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 执行步骤4: 应用构建" -ForegroundColor Cyan
Write-Host "=" * 30

# 构建后端
Write-Host "🔨 构建后端应用..." -ForegroundColor Yellow
Set-Location "backend"
npm install
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.scripts.build) {
        npm run build
        Write-Host "✅ 后端构建完成" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ 后端无需构建步骤" -ForegroundColor Cyan
    }
}

# 构建前端
Write-Host "🔨 构建前端应用..." -ForegroundColor Yellow
Set-Location "..\frontend"
npm install
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.scripts.build) {
        npm run build
        Write-Host "✅ 前端构建完成" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ 前端无需构建步骤" -ForegroundColor Cyan
    }
}

Set-Location ".."

Write-Host ""
Write-Host "🎯 执行步骤5: 启动应用服务" -ForegroundColor Cyan
Write-Host "=" * 30

Write-Host "🚀 启动应用服务指令:" -ForegroundColor Green
Write-Host ""
Write-Host "启动后端服务 (新PowerShell窗口):" -ForegroundColor Yellow
Write-Host "Set-Location 'C:\www\trade-platform\backend'" -ForegroundColor Green
Write-Host "`$env:SSL_ENABLED='true'" -ForegroundColor Green
Write-Host "npm start" -ForegroundColor Green
Write-Host ""
Write-Host "启动前端服务 (另一个新PowerShell窗口):" -ForegroundColor Yellow  
Write-Host "Set-Location 'C:\www\trade-platform\frontend'" -ForegroundColor Green
Write-Host "npm start" -ForegroundColor Green

Write-Host ""
Write-Host "🌐 访问地址:" -ForegroundColor Cyan
Write-Host "前端: https://wwwcn.uk:3000" -ForegroundColor White
Write-Host "后端API: https://api.wwwcn.uk:5000" -ForegroundColor White
Write-Host "或直接IP访问: https://116.62.44.24:3000" -ForegroundColor Gray

Write-Host ""
Write-Host "🔄 最终步骤: Cloudflare SSL配置" -ForegroundColor Cyan
Write-Host "=" * 30
Write-Host "SSL证书配置完成并测试HTTPS可访问后:" -ForegroundColor Yellow
Write-Host "1. 登录 Cloudflare Dashboard" -ForegroundColor White
Write-Host "2. 进入 SSL/TLS > 概述" -ForegroundColor White  
Write-Host "3. 将加密模式设置为: 完全(严格)" -ForegroundColor White
Write-Host "4. 启用 HSTS (安全传输)" -ForegroundColor White

Write-Host ""
Write-Host "🎉 部署流程完成!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host "📞 如有问题，请检查防火墙、DNS解析和SSL证书配置" -ForegroundColor Cyan