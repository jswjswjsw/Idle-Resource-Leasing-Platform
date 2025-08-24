# 环境变量配置脚本
# 配置Trade Platform项目的环境变量文件

Write-Host "⚙️ 配置项目环境变量" -ForegroundColor Cyan
Write-Host "=" * 50

# 进入项目目录
$projectPath = "C:\www\trade-platform"
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ 项目目录不存在: $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath
Write-Host "📁 项目目录: $projectPath" -ForegroundColor Green

# 配置后端环境变量
Write-Host "📋 配置后端环境变量..." -ForegroundColor Yellow
$backendEnvExample = "backend\.env.example"
$backendEnv = "backend\.env"

if (Test-Path $backendEnvExample) {
    Copy-Item $backendEnvExample $backendEnv -Force
    Write-Host "✅ 后端环境变量文件已创建: $backendEnv" -ForegroundColor Green
    
    # 显示需要配置的环境变量
    Write-Host "🔧 需要配置的后端环境变量：" -ForegroundColor Cyan
    Get-Content $backendEnv | Select-String -Pattern "^[^#].*=" | ForEach-Object {
        $line = $_.Line
        if ($line -like "*=*") {
            $key = ($line -split "=")[0]
            Write-Host "  $key" -ForegroundColor White
        }
    }
} else {
    Write-Host "⚠️ 后端环境变量示例文件不存在" -ForegroundColor Yellow
    
    # 创建基础的.env文件
    $basicBackendEnv = @"
# 服务器配置
PORT=5000
NODE_ENV=production

# 数据库配置
DATABASE_URL="file:./dev.db"

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=https://wwwcn.uk

# SSL配置
SSL_ENABLED=true
SSL_CERT_PATH=C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/wwwcn.uk/cert.pem
SSL_KEY_PATH=C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/wwwcn.uk/key.pem
"@
    
    $basicBackendEnv | Out-File -FilePath $backendEnv -Encoding UTF8
    Write-Host "✅ 创建了基础后端环境变量文件" -ForegroundColor Green
}

# 配置前端环境变量
Write-Host ""
Write-Host "📋 配置前端环境变量..." -ForegroundColor Yellow
$frontendEnvExample = "frontend\.env.example"
$frontendEnv = "frontend\.env"

if (Test-Path $frontendEnvExample) {
    Copy-Item $frontendEnvExample $frontendEnv -Force
    Write-Host "✅ 前端环境变量文件已创建: $frontendEnv" -ForegroundColor Green
    
    # 显示需要配置的环境变量
    Write-Host "🔧 需要配置的前端环境变量：" -ForegroundColor Cyan
    Get-Content $frontendEnv | Select-String -Pattern "^[^#].*=" | ForEach-Object {
        $line = $_.Line
        if ($line -like "*=*") {
            $key = ($line -split "=")[0]
            Write-Host "  $key" -ForegroundColor White
        }
    }
} else {
    Write-Host "⚠️ 前端环境变量示例文件不存在" -ForegroundColor Yellow
    
    # 创建基础的.env文件
    $basicFrontendEnv = @"
# API配置
REACT_APP_API_URL=https://api.wwwcn.uk
REACT_APP_WS_URL=wss://api.wwwcn.uk

# 应用配置
REACT_APP_APP_NAME=Trade Platform
REACT_APP_VERSION=1.0.0

# 第三方服务配置
# REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
# REACT_APP_STRIPE_PUBLIC_KEY=your-stripe-public-key
"@
    
    $basicFrontendEnv | Out-File -FilePath $frontendEnv -Encoding UTF8
    Write-Host "✅ 创建了基础前端环境变量文件" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 环境变量配置完成！" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "📋 重要提醒：" -ForegroundColor Cyan
Write-Host "1. 检查并修改数据库连接配置" -ForegroundColor White
Write-Host "2. 设置强密码的JWT_SECRET" -ForegroundColor White
Write-Host "3. 配置第三方服务API密钥" -ForegroundColor White
Write-Host "4. 确认SSL证书路径正确" -ForegroundColor White
Write-Host ""
Write-Host "📁 环境变量文件位置：" -ForegroundColor Yellow
Write-Host "  后端: $backendEnv" -ForegroundColor White
Write-Host "  前端: $frontendEnv" -ForegroundColor White
Write-Host ""
Write-Host "🔧 编辑命令：" -ForegroundColor Cyan
Write-Host "  notepad $backendEnv" -ForegroundColor Green
Write-Host "  notepad $frontendEnv" -ForegroundColor Green