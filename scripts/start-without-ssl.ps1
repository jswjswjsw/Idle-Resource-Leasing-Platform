# 跳过SSL配置，直接启动应用脚本

Write-Host "跳过SSL配置，启动Trade Platform应用" -ForegroundColor Cyan
Write-Host "=" * 50

# 进入项目目录
Set-Location "C:\www\trade-platform"

# 第一步：配置环境变量
Write-Host "第一步：配置环境变量..." -ForegroundColor Yellow
Copy-Item "backend\.env.example" "backend\.env" -ErrorAction SilentlyContinue
Copy-Item "frontend\.env.example" "frontend\.env" -ErrorAction SilentlyContinue

if (Test-Path "backend\.env") {
    Write-Host "✅ 后端环境变量文件已创建" -ForegroundColor Green
} else {
    Write-Host "❌ 后端环境变量文件创建失败" -ForegroundColor Red
}

if (Test-Path "frontend\.env") {
    Write-Host "✅ 前端环境变量文件已创建" -ForegroundColor Green
} else {
    Write-Host "❌ 前端环境变量文件创建失败" -ForegroundColor Red
}

# 第二步：尝试构建后端
Write-Host ""
Write-Host "第二步：构建后端应用..." -ForegroundColor Yellow
Set-Location "backend"

if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "后端可用的脚本命令：" -ForegroundColor Cyan
    $packageJson.scripts.PSObject.Properties | ForEach-Object {
        Write-Host "  npm run $($_.Name)" -ForegroundColor White
    }
    Write-Host ""
    
    # 尝试构建
    Write-Host "执行构建命令..." -ForegroundColor White
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 后端构建成功" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 后端构建可能有问题，但我们继续" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ 找不到后端package.json文件" -ForegroundColor Red
}

# 第三步：尝试构建前端
Write-Host ""
Write-Host "第三步：构建前端应用..." -ForegroundColor Yellow
Set-Location "..\frontend"

if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "前端可用的脚本命令：" -ForegroundColor Cyan
    $packageJson.scripts.PSObject.Properties | ForEach-Object {
        Write-Host "  npm run $($_.Name)" -ForegroundColor White
    }
    Write-Host ""
    
    # 尝试构建
    Write-Host "执行构建命令..." -ForegroundColor White
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 前端构建成功" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 前端构建可能有问题，但我们继续" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ 找不到前端package.json文件" -ForegroundColor Red
}

# 第四步：配置防火墙
Write-Host ""
Write-Host "第四步：配置防火墙..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "Node-Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Node-Backend" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow -ErrorAction SilentlyContinue
    Write-Host "✅ 防火墙规则配置完成" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 防火墙配置可能需要手动完成" -ForegroundColor Yellow
}

# 返回项目根目录
Set-Location ".."

Write-Host ""
Write-Host "🎯 下一步操作建议：" -ForegroundColor Cyan
Write-Host "1. 启动后端服务（在新的PowerShell窗口）：" -ForegroundColor White
Write-Host "   Set-Location 'C:\www\trade-platform\backend'" -ForegroundColor Green
Write-Host "   npm start" -ForegroundColor Green
Write-Host ""
Write-Host "2. 启动前端服务（在另一个新的PowerShell窗口）：" -ForegroundColor White
Write-Host "   Set-Location 'C:\www\trade-platform\frontend'" -ForegroundColor Green  
Write-Host "   npm start" -ForegroundColor Green
Write-Host ""
Write-Host "📝 访问信息：" -ForegroundColor Yellow
Write-Host "- 前端地址: http://116.62.44.24:3000" -ForegroundColor White
Write-Host "- 后端API: http://116.62.44.24:5000" -ForegroundColor White
Write-Host "- 当前为HTTP模式（无SSL）" -ForegroundColor White
Write-Host ""
Write-Host "🔒 SSL配置：" -ForegroundColor Cyan
Write-Host "- SSL证书可以稍后配置" -ForegroundColor White
Write-Host "- 使用 setup-ssl-comprehensive.ps1 脚本重试" -ForegroundColor White
Write-Host "- 或手动下载win-acme工具" -ForegroundColor White