# 应用构建和启动脚本
# 构建前后端应用并启动服务

param(
    [switch]$SkipBuild = $false,
    [switch]$HttpOnly = $false
)

Write-Host "🚀 Trade Platform 应用构建和启动" -ForegroundColor Cyan
Write-Host "=" * 50

# 进入项目目录
$projectPath = "C:\www\trade-platform"
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ 项目目录不存在: $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath
Write-Host "📁 当前目录: $projectPath" -ForegroundColor Green

# 检查环境变量文件
Write-Host "🔍 检查环境变量配置..." -ForegroundColor Yellow
$backendEnv = Test-Path "backend\.env"
$frontendEnv = Test-Path "frontend\.env"

if ($backendEnv) {
    Write-Host "✅ 后端环境变量文件存在" -ForegroundColor Green
} else {
    Write-Host "⚠️ 后端环境变量文件不存在，请先运行环境变量配置脚本" -ForegroundColor Yellow
}

if ($frontendEnv) {
    Write-Host "✅ 前端环境变量文件存在" -ForegroundColor Green
} else {
    Write-Host "⚠️ 前端环境变量文件不存在，请先运行环境变量配置脚本" -ForegroundColor Yellow
}

# 构建后端应用
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "🔨 构建后端应用..." -ForegroundColor Yellow
    Set-Location "backend"
    
    if (Test-Path "package.json") {
        Write-Host "📦 安装后端依赖..." -ForegroundColor Cyan
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 后端依赖安装完成" -ForegroundColor Green
        }
        
        # 检查可用的构建脚本
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.build) {
            Write-Host "🏗️ 执行后端构建..." -ForegroundColor Cyan
            npm run build
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ 后端构建成功" -ForegroundColor Green
            } else {
                Write-Host "⚠️ 后端构建出现问题，但继续执行" -ForegroundColor Yellow
            }
        } else {
            Write-Host "ℹ️ 后端项目无需构建步骤" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ 后端package.json文件不存在" -ForegroundColor Red
    }
    
    Set-Location ".."
}

# 构建前端应用
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "🔨 构建前端应用..." -ForegroundColor Yellow
    Set-Location "frontend"
    
    if (Test-Path "package.json") {
        Write-Host "📦 安装前端依赖..." -ForegroundColor Cyan
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 前端依赖安装完成" -ForegroundColor Green
        }
        
        # 检查可用的构建脚本
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.build) {
            Write-Host "🏗️ 执行前端构建..." -ForegroundColor Cyan
            npm run build
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ 前端构建成功" -ForegroundColor Green
            } else {
                Write-Host "⚠️ 前端构建出现问题" -ForegroundColor Yellow
            }
        } else {
            Write-Host "ℹ️ 前端项目无需构建步骤" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ 前端package.json文件不存在" -ForegroundColor Red
    }
    
    Set-Location ".."
}

# 配置防火墙
Write-Host ""
Write-Host "🔥 配置Windows防火墙..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "HTTP-Port-80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "HTTPS-Port-443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Node-Frontend-3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Node-Backend-5000" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow -ErrorAction SilentlyContinue
    Write-Host "✅ 防火墙规则配置完成" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 防火墙配置可能需要管理员权限" -ForegroundColor Yellow
}

# 检查SSL证书
Write-Host ""
Write-Host "🔒 检查SSL证书..." -ForegroundColor Yellow
$sslCertPath = "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\wwwcn.uk\cert.pem"
$sslKeyPath = "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\wwwcn.uk\key.pem"

$sslAvailable = (Test-Path $sslCertPath) -and (Test-Path $sslKeyPath)

if ($sslAvailable -and -not $HttpOnly) {
    Write-Host "✅ SSL证书文件存在，将启用HTTPS" -ForegroundColor Green
    Write-Host "   证书: $sslCertPath" -ForegroundColor Gray
    Write-Host "   私钥: $sslKeyPath" -ForegroundColor Gray
} else {
    Write-Host "⚠️ SSL证书不可用，将使用HTTP模式" -ForegroundColor Yellow
    $HttpOnly = $true
}

Write-Host ""
Write-Host "🎯 应用启动准备完成！" -ForegroundColor Green
Write-Host "=" * 50

# 启动指令
if ($HttpOnly) {
    Write-Host "📋 HTTP模式启动指令：" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "启动后端服务（新PowerShell窗口）：" -ForegroundColor Yellow
    Write-Host "Set-Location 'C:\www\trade-platform\backend'" -ForegroundColor Green
    Write-Host "npm start" -ForegroundColor Green
    Write-Host ""
    Write-Host "启动前端服务（另一个新PowerShell窗口）：" -ForegroundColor Yellow
    Write-Host "Set-Location 'C:\www\trade-platform\frontend'" -ForegroundColor Green
    Write-Host "npm start" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 访问地址：" -ForegroundColor Cyan
    Write-Host "前端: http://116.62.44.24:3000" -ForegroundColor White
    Write-Host "后端API: http://116.62.44.24:5000" -ForegroundColor White
} else {
    Write-Host "📋 HTTPS模式启动指令：" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "启动HTTPS后端服务（新PowerShell窗口）：" -ForegroundColor Yellow
    Write-Host "Set-Location 'C:\www\trade-platform\backend'" -ForegroundColor Green
    Write-Host "`$env:SSL_ENABLED='true'" -ForegroundColor Green
    Write-Host "npm start" -ForegroundColor Green
    Write-Host ""
    Write-Host "启动前端服务（另一个新PowerShell窗口）：" -ForegroundColor Yellow
    Write-Host "Set-Location 'C:\www\trade-platform\frontend'" -ForegroundColor Green
    Write-Host "npm start" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 访问地址：" -ForegroundColor Cyan
    Write-Host "前端: https://wwwcn.uk:3000 或 https://116.62.44.24:3000" -ForegroundColor White
    Write-Host "后端API: https://api.wwwcn.uk:5000 或 https://116.62.44.24:5000" -ForegroundColor White
}

Write-Host ""
Write-Host "🔄 后续步骤：" -ForegroundColor Cyan
Write-Host "1. 启动应用服务" -ForegroundColor White
Write-Host "2. 测试本地访问功能" -ForegroundColor White
Write-Host "3. 如启用SSL，需在Cloudflare设置'完全(严格)'模式" -ForegroundColor White
Write-Host "4. 测试外网访问功能" -ForegroundColor White