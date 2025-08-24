# 部署验证脚本
# 测试Trade Platform部署是否成功

Write-Host "✅ Trade Platform部署验证" -ForegroundColor Cyan
Write-Host "=" * 50

Write-Host "🔍 开始验证部署结果..." -ForegroundColor Yellow

# 验证项目目录
Write-Host ""
Write-Host "1️⃣ 验证项目目录结构..." -ForegroundColor Cyan
$projectPath = "C:\www\trade-platform"
if (Test-Path $projectPath) {
    Write-Host "✅ 项目目录存在: $projectPath" -ForegroundColor Green
    
    $requiredDirs = @("backend", "frontend", "docs", "scripts")
    foreach ($dir in $requiredDirs) {
        $dirPath = Join-Path $projectPath $dir
        if (Test-Path $dirPath) {
            Write-Host "✅ $dir 目录存在" -ForegroundColor Green
        } else {
            Write-Host "❌ $dir 目录缺失" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ 项目目录不存在: $projectPath" -ForegroundColor Red
}

# 验证环境变量文件
Write-Host ""
Write-Host "2️⃣ 验证环境变量配置..." -ForegroundColor Cyan
$backendEnv = "$projectPath\backend\.env"
$frontendEnv = "$projectPath\frontend\.env"

if (Test-Path $backendEnv) {
    Write-Host "✅ 后端环境变量文件存在" -ForegroundColor Green
    $envContent = Get-Content $backendEnv | Where-Object { $_ -match "^[^#].*=" }
    Write-Host "   包含 $($envContent.Count) 个配置项" -ForegroundColor Gray
} else {
    Write-Host "❌ 后端环境变量文件缺失" -ForegroundColor Red
}

if (Test-Path $frontendEnv) {
    Write-Host "✅ 前端环境变量文件存在" -ForegroundColor Green
    $envContent = Get-Content $frontendEnv | Where-Object { $_ -match "^[^#].*=" }
    Write-Host "   包含 $($envContent.Count) 个配置项" -ForegroundColor Gray
} else {
    Write-Host "❌ 前端环境变量文件缺失" -ForegroundColor Red
}

# 验证SSL证书
Write-Host ""
Write-Host "3️⃣ 验证SSL证书配置..." -ForegroundColor Cyan
$sslCertPath = "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\wwwcn.uk\cert.pem"
$sslKeyPath = "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\wwwcn.uk\key.pem"

if (Test-Path $sslCertPath) {
    Write-Host "✅ SSL证书文件存在" -ForegroundColor Green
    $certInfo = Get-Item $sslCertPath
    Write-Host "   创建时间: $($certInfo.CreationTime)" -ForegroundColor Gray
    Write-Host "   文件大小: $($certInfo.Length) bytes" -ForegroundColor Gray
} else {
    Write-Host "⚠️ SSL证书文件不存在，可能需要完成证书申请" -ForegroundColor Yellow
}

if (Test-Path $sslKeyPath) {
    Write-Host "✅ SSL私钥文件存在" -ForegroundColor Green
} else {
    Write-Host "⚠️ SSL私钥文件不存在" -ForegroundColor Yellow
}

# 验证防火墙规则
Write-Host ""
Write-Host "4️⃣ 验证防火墙规则..." -ForegroundColor Cyan
$requiredPorts = @(80, 443, 3000, 5000)
foreach ($port in $requiredPorts) {
    $rule = Get-NetFirewallRule | Where-Object { 
        $_.DisplayName -like "*$port*" -and $_.Direction -eq "Inbound" -and $_.Action -eq "Allow" 
    } | Select-Object -First 1
    
    if ($rule) {
        Write-Host "✅ 端口 $port 防火墙规则已配置" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 端口 $port 防火墙规则可能需要配置" -ForegroundColor Yellow
    }
}

# 验证Node.js和npm
Write-Host ""
Write-Host "5️⃣ 验证Node.js环境..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js版本: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js未安装或不可用" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Node.js检查失败" -ForegroundColor Red
}

try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "✅ npm版本: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ npm未安装或不可用" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ npm检查失败" -ForegroundColor Red
}

# 验证项目依赖
Write-Host ""
Write-Host "6️⃣ 验证项目依赖..." -ForegroundColor Cyan

# 检查后端依赖
if (Test-Path "$projectPath\backend\package.json") {
    Write-Host "📦 检查后端依赖..." -ForegroundColor White
    Set-Location "$projectPath\backend"
    if (Test-Path "node_modules") {
        $backendModules = Get-ChildItem "node_modules" | Measure-Object
        Write-Host "✅ 后端依赖已安装: $($backendModules.Count) 个包" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 后端依赖未安装" -ForegroundColor Yellow
    }
}

# 检查前端依赖
if (Test-Path "$projectPath\frontend\package.json") {
    Write-Host "📦 检查前端依赖..." -ForegroundColor White
    Set-Location "$projectPath\frontend"
    if (Test-Path "node_modules") {
        $frontendModules = Get-ChildItem "node_modules" | Measure-Object
        Write-Host "✅ 前端依赖已安装: $($frontendModules.Count) 个包" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 前端依赖未安装" -ForegroundColor Yellow
    }
}

Set-Location $projectPath

# 验证构建输出
Write-Host ""
Write-Host "7️⃣ 验证构建输出..." -ForegroundColor Cyan

if (Test-Path "$projectPath\frontend\build") {
    $buildFiles = Get-ChildItem "$projectPath\frontend\build" -Recurse | Measure-Object
    Write-Host "✅ 前端构建输出存在: $($buildFiles.Count) 个文件" -ForegroundColor Green
} elseif (Test-Path "$projectPath\frontend\dist") {
    $distFiles = Get-ChildItem "$projectPath\frontend\dist" -Recurse | Measure-Object
    Write-Host "✅ 前端构建输出存在: $($distFiles.Count) 个文件" -ForegroundColor Green
} else {
    Write-Host "⚠️ 前端构建输出未找到" -ForegroundColor Yellow
}

if (Test-Path "$projectPath\backend\dist") {
    $backendBuild = Get-ChildItem "$projectPath\backend\dist" -Recurse | Measure-Object
    Write-Host "✅ 后端构建输出存在: $($backendBuild.Count) 个文件" -ForegroundColor Green
} else {
    Write-Host "ℹ️ 后端可能无需构建输出" -ForegroundColor Cyan
}

# 网络连接测试
Write-Host ""
Write-Host "8️⃣ 网络连接测试..." -ForegroundColor Cyan

# 测试端口监听
$testPorts = @(3000, 5000)
foreach ($port in $testPorts) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "✅ 端口 $port 正在监听" -ForegroundColor Green
        $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "   进程: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Gray
        }
    } else {
        Write-Host "ℹ️ 端口 $port 未在监听（应用可能未启动）" -ForegroundColor Cyan
    }
}

# DNS解析测试
Write-Host ""
Write-Host "🌐 DNS解析测试..." -ForegroundColor White
try {
    $dnsResult = Resolve-DnsName -Name "wwwcn.uk" -Type A -ErrorAction SilentlyContinue
    if ($dnsResult) {
        Write-Host "✅ 域名解析成功: wwwcn.uk -> $($dnsResult.IPAddress -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 域名解析失败或未配置" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ DNS测试失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 生成验证报告
Write-Host ""
Write-Host "📊 验证报告" -ForegroundColor Green
Write-Host "=" * 50

$reportItems = @(
    @{Item="项目目录"; Status=(Test-Path $projectPath)},
    @{Item="后端环境变量"; Status=(Test-Path $backendEnv)},
    @{Item="前端环境变量"; Status=(Test-Path $frontendEnv)},
    @{Item="SSL证书"; Status=(Test-Path $sslCertPath)},
    @{Item="Node.js"; Status=($nodeVersion -ne $null)},
    @{Item="npm"; Status=($npmVersion -ne $null)}
)

$passedCount = 0
$totalCount = $reportItems.Count

foreach ($item in $reportItems) {
    $status = if ($item.Status) { "✅ 通过"; $passedCount++ } else { "❌ 失败" }
    Write-Host "$($item.Item): $status" -ForegroundColor $(if ($item.Status) { "Green" } else { "Red" })
}

Write-Host ""
Write-Host "总体评分: $passedCount/$totalCount" -ForegroundColor $(if ($passedCount -eq $totalCount) { "Green" } else { "Yellow" })

if ($passedCount -eq $totalCount) {
    Write-Host "🎉 部署验证完全通过！" -ForegroundColor Green
} elseif ($passedCount -ge ($totalCount * 0.8)) {
    Write-Host "⚠️ 部署基本完成，有少量问题需要解决" -ForegroundColor Yellow
} else {
    Write-Host "❌ 部署存在较多问题，需要进一步配置" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 下一步操作建议：" -ForegroundColor Cyan

if (-not (Test-Path $sslCertPath)) {
    Write-Host "1. 完成SSL证书申请: C:\ssl\apply-ssl.bat" -ForegroundColor Yellow
}

if (-not (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue)) {
    Write-Host "2. 启动前端应用服务" -ForegroundColor Yellow
}

if (-not (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue)) {
    Write-Host "3. 启动后端API服务" -ForegroundColor Yellow
}

Write-Host "4. 测试应用访问功能" -ForegroundColor Yellow
Write-Host "5. 配置Cloudflare SSL模式" -ForegroundColor Yellow

Write-Host ""
Write-Host "📞 访问测试命令：" -ForegroundColor Cyan
Write-Host "测试前端: curl http://116.62.44.24:3000" -ForegroundColor Green
Write-Host "测试后端: curl http://116.62.44.24:5000/api/health" -ForegroundColor Green