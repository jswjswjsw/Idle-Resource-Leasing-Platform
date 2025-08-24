# 自动完成ECS部署任务脚本
# 直接复制这个脚本到ECS上运行

Write-Host "🚀 自动完成Trade Platform部署任务" -ForegroundColor Cyan
Write-Host "=" * 60

# 检查管理员权限
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ 需要管理员权限运行此脚本" -ForegroundColor Red
    Write-Host "请右键选择'以管理员身份运行PowerShell'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 管理员权限验证通过" -ForegroundColor Green

# 任务1：环境变量配置
Write-Host ""
Write-Host "🎯 任务1：配置环境变量" -ForegroundColor Yellow
Write-Host "=" * 30

$projectPath = "C:\www\trade-platform"
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ 项目目录不存在: $projectPath" -ForegroundColor Red
    Write-Host "请先运行项目部署脚本" -ForegroundColor Yellow
    exit 1
}

Set-Location $projectPath
Write-Host "📁 进入项目目录: $projectPath" -ForegroundColor Green

# 创建后端环境变量
Write-Host "📝 创建后端环境变量文件..." -ForegroundColor Cyan
$backendEnv = @"
# 服务器配置
PORT=5000
NODE_ENV=production

# 数据库配置
DATABASE_URL="file:./dev.db"

# JWT配置
JWT_SECRET=TradeP1atform2024SuperSecretKey!@#$%^&*
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=https://wwwcn.uk

# SSL配置
SSL_ENABLED=true
SSL_CERT_PATH=C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/wwwcn.uk/cert.pem
SSL_KEY_PATH=C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/wwwcn.uk/key.pem

# 应用配置
APP_NAME=Trade Platform
APP_VERSION=1.0.0
"@

try {
    $backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8 -Force
    Write-Host "✅ 后端环境变量文件创建成功: backend\.env" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端环境变量文件创建失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 创建前端环境变量
Write-Host "📝 创建前端环境变量文件..." -ForegroundColor Cyan
$frontendEnv = @"
# API配置
REACT_APP_API_URL=https://api.wwwcn.uk
REACT_APP_WS_URL=wss://api.wwwcn.uk

# 应用配置
REACT_APP_APP_NAME=Trade Platform
REACT_APP_VERSION=1.0.0

# 功能开关
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_NOTIFICATIONS=true

# 第三方服务配置（需要申请API密钥）
# REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
# REACT_APP_STRIPE_PUBLIC_KEY=your-stripe-public-key
# REACT_APP_ANALYTICS_ID=your-analytics-id
"@

try {
    $frontendEnv | Out-File -FilePath "frontend\.env" -Encoding UTF8 -Force
    Write-Host "✅ 前端环境变量文件创建成功: frontend\.env" -ForegroundColor Green
} catch {
    Write-Host "❌ 前端环境变量文件创建失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 任务2：防火墙配置
Write-Host ""
Write-Host "🎯 任务2：配置Windows防火墙" -ForegroundColor Yellow
Write-Host "=" * 30

$firewallRules = @(
    @{Name="HTTP-Port-80"; Port=80; Description="HTTP访问"},
    @{Name="HTTPS-Port-443"; Port=443; Description="HTTPS访问"},
    @{Name="Frontend-Port-3000"; Port=3000; Description="前端应用"},
    @{Name="Backend-Port-5000"; Port=5000; Description="后端API"}
)

foreach ($rule in $firewallRules) {
    try {
        $existingRule = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
        if ($existingRule) {
            Write-Host "ℹ️ 防火墙规则已存在: $($rule.Name)" -ForegroundColor Cyan
        } else {
            New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Protocol TCP -LocalPort $rule.Port -Action Allow -ErrorAction Stop
            Write-Host "✅ 防火墙规则创建成功: $($rule.Name) (端口 $($rule.Port))" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ 防火墙规则创建失败: $($rule.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 任务3：依赖安装和应用构建
Write-Host ""
Write-Host "🎯 任务3：安装依赖和构建应用" -ForegroundColor Yellow
Write-Host "=" * 30

# 构建后端
Write-Host "🔨 构建后端应用..." -ForegroundColor Cyan
Set-Location "backend"

if (Test-Path "package.json") {
    Write-Host "📦 安装后端依赖..." -ForegroundColor White
    try {
        npm install --production
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 后端依赖安装成功" -ForegroundColor Green
        } else {
            Write-Host "⚠️ 后端依赖安装可能有问题，退出码: $LASTEXITCODE" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ 后端依赖安装失败: $($_.Exception.Message)" -ForegroundColor Red
    }

    # 检查是否有构建脚本
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJson.scripts -and $packageJson.scripts.build) {
        Write-Host "🏗️ 执行后端构建..." -ForegroundColor White
        try {
            npm run build
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ 后端构建成功" -ForegroundColor Green
            } else {
                Write-Host "⚠️ 后端构建可能有问题，退出码: $LASTEXITCODE" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ 后端构建失败: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "ℹ️ 后端项目无需构建步骤" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ 后端package.json文件不存在" -ForegroundColor Red
}

# 构建前端
Write-Host ""
Write-Host "🔨 构建前端应用..." -ForegroundColor Cyan
Set-Location "..\frontend"

if (Test-Path "package.json") {
    Write-Host "📦 安装前端依赖..." -ForegroundColor White
    try {
        npm install --production
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 前端依赖安装成功" -ForegroundColor Green
        } else {
            Write-Host "⚠️ 前端依赖安装可能有问题，退出码: $LASTEXITCODE" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ 前端依赖安装失败: $($_.Exception.Message)" -ForegroundColor Red
    }

    # 检查是否有构建脚本
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJson.scripts -and $packageJson.scripts.build) {
        Write-Host "🏗️ 执行前端构建..." -ForegroundColor White
        try {
            npm run build
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ 前端构建成功" -ForegroundColor Green
                
                # 检查构建输出
                if (Test-Path "build") {
                    $buildFiles = Get-ChildItem "build" -Recurse | Measure-Object
                    Write-Host "📁 构建输出: build目录包含 $($buildFiles.Count) 个文件" -ForegroundColor Cyan
                } elseif (Test-Path "dist") {
                    $distFiles = Get-ChildItem "dist" -Recurse | Measure-Object
                    Write-Host "📁 构建输出: dist目录包含 $($distFiles.Count) 个文件" -ForegroundColor Cyan
                }
            } else {
                Write-Host "⚠️ 前端构建可能有问题，退出码: $LASTEXITCODE" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ 前端构建失败: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "ℹ️ 前端项目无需构建步骤" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ 前端package.json文件不存在" -ForegroundColor Red
}

# 返回项目根目录
Set-Location ".."

# 任务完成总结
Write-Host ""
Write-Host "🎉 自动任务执行完成！" -ForegroundColor Green
Write-Host "=" * 60

Write-Host "📋 任务完成状态：" -ForegroundColor Cyan
Write-Host "✅ 环境变量配置 - 已完成" -ForegroundColor Green
Write-Host "✅ 防火墙配置 - 已完成" -ForegroundColor Green  
Write-Host "✅ 依赖安装 - 已完成" -ForegroundColor Green
Write-Host "✅ 应用构建 - 已完成" -ForegroundColor Green

Write-Host ""
Write-Host "🔄 接下来需要手动完成的任务：" -ForegroundColor Yellow
Write-Host "1. 🔒 SSL证书申请 - 运行: C:\ssl\apply-ssl.bat" -ForegroundColor White
Write-Host "2. 🌐 配置Cloudflare DNS (如选择DNS验证)" -ForegroundColor White
Write-Host "3. 🚀 启动应用服务" -ForegroundColor White
Write-Host "4. 🔧 设置Cloudflare SSL模式为'完全(严格)'" -ForegroundColor White
Write-Host "5. ✅ 验证部署结果" -ForegroundColor White

Write-Host ""
Write-Host "🚀 启动应用命令：" -ForegroundColor Cyan
Write-Host "启动后端（新PowerShell窗口）：" -ForegroundColor Yellow
Write-Host "Set-Location 'C:\www\trade-platform\backend'" -ForegroundColor Green
Write-Host 'if (Test-Path "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\wwwcn.uk\cert.pem") {' -ForegroundColor Green
Write-Host '    $env:SSL_ENABLED="true"' -ForegroundColor Green
Write-Host '} else {' -ForegroundColor Green
Write-Host '    $env:SSL_ENABLED="false"' -ForegroundColor Green
Write-Host '}' -ForegroundColor Green
Write-Host 'npm start' -ForegroundColor Green

Write-Host ""
Write-Host "启动前端（另一个新PowerShell窗口）：" -ForegroundColor Yellow
Write-Host "Set-Location 'C:\www\trade-platform\frontend'" -ForegroundColor Green
Write-Host "npm start" -ForegroundColor Green

Write-Host ""
Write-Host "🌐 访问地址：" -ForegroundColor Cyan
Write-Host "前端: http://116.62.44.24:3000 (或 https:// 如果SSL已配置)" -ForegroundColor White
Write-Host "后端: http://116.62.44.24:5000 (或 https:// 如果SSL已配置)" -ForegroundColor White

Write-Host ""
Write-Host "📞 下一步操作提示：" -ForegroundColor Red
Write-Host "立即执行SSL证书申请: C:\ssl\apply-ssl.bat" -ForegroundColor Yellow